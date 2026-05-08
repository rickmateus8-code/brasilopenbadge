/**
 * GET /api/pix/status?transaction_id=xxx — Consultar status de pagamento PIX
 */
import type { Env } from '../../types';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const BLACKPAY_API = 'https://api.paymentsblack.com';
const FALLBACK_API_KEY = 'htus_a21327358c860b7da826727f1d980695';
const FALLBACK_API_SECRET = 'bcda776111b91c17bae760d7fca1c1fb6ad650c3eebac51f1d3c47be65a9c2de';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthUser(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  return env.DB.prepare(
    'SELECT id, username, balance FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

function toJson(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function toCents(value: any) {
  return Math.round(Number(value || 0) * 100);
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return toJson({ success: false, error: 'Não autenticado' }, 401);
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transaction_id');

    if (!transactionId) {
      return toJson({ success: false, error: 'transaction_id obrigatório' }, 400);
    }

    const apiKey = (env as any).PAYMENTS_BLACK_API_KEY || FALLBACK_API_KEY;
    const apiSecret = (env as any).PAYMENTS_BLACK_API_SECRET || FALLBACK_API_SECRET;

    const statusResponse = await fetch(`${BLACKPAY_API}/api/v1/transactions/${encodeURIComponent(transactionId)}/status`, {
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
      },
    });

    const statusData = await statusResponse.json().catch(() => ({})) as any;
    const txData = statusData?.data || {};
    const gatewayStatus = String(txData.status || '').toUpperCase();
    const isPaid = gatewayStatus === 'COMPLETED';

    if (isPaid) {
      const existing = await env.DB.prepare(
        "SELECT id, user_id, amount, status FROM transactions WHERE external_id = ? LIMIT 1"
      ).bind(transactionId).first<any>().catch(() => null);

      const amountCents = existing?.amount ? Number(existing.amount) : toCents(txData.amount);
      const creditedAlready = existing?.status === 'completed';
      const ownerUserId = existing?.user_id || user.id;

      if (!creditedAlready && amountCents > 0) {
        await env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(amountCents, ownerUserId).run();
        await env.DB.prepare(
          "UPDATE transactions SET status = 'completed' WHERE external_id = ?"
        ).bind(transactionId).run().catch(() => {});
      }

      const updatedUser = await env.DB.prepare('SELECT balance FROM users WHERE id = ?').bind(user.id).first<any>();
      return toJson({
        success: true,
        status: gatewayStatus,
        paid: true,
        balance: updatedUser?.balance ?? user.balance,
      });
    }

    return toJson({
      success: true,
      status: gatewayStatus || 'PENDING',
      paid: false,
    });
  } catch (err: any) {
    console.error('PIX status error:', err);
    return toJson({ success: false, error: 'Erro ao consultar status' }, 500);
  }
};
