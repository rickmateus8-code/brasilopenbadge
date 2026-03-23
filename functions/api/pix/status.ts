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

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: CORS });
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transaction_id');

    if (!transactionId) {
      return new Response(JSON.stringify({ success: false, error: 'transaction_id obrigatório' }), { status: 400, headers: CORS });
    }

    const HYPERPIX_SK = env.HYPERPIX_SECRET_KEY || 'sk_live_de0f2c5b610735d0659511125bbbf224944748769d56df8a50fe861d2ebbe981';
    const HYPERPIX_API = 'https://api.hyperpix.pro/v1';

    // Consultar status na HyperPix
    const statusResponse = await fetch(`${HYPERPIX_API}/pix/status/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${HYPERPIX_SK}`,
        'Content-Type': 'application/json',
      },
    });

    const statusData = await statusResponse.json() as any;
    const txData = statusData.data || statusData;
    const status = txData.status || txData.payment_status || 'pending';
    const isPaid = ['paid', 'completed', 'approved', 'PAID', 'confirmed'].includes(status);

    // Se pago e não processado ainda, creditar automaticamente
    if (isPaid) {
      const existing = await env.DB.prepare(
        "SELECT id FROM transactions WHERE external_id = ? AND status = 'completed'"
      ).bind(transactionId).first<any>().catch(() => null);

      if (!existing) {
        const amount = Number(txData.amount || 0);
        if (amount > 0) {
          await env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(amount, user.id).run();
          await env.DB.prepare(
            "UPDATE transactions SET status = 'completed' WHERE external_id = ?"
          ).bind(transactionId).run().catch(() => {});
        }
      }

      // Retornar saldo atualizado
      const updatedUser = await env.DB.prepare('SELECT balance FROM users WHERE id = ?').bind(user.id).first<any>();
      return new Response(JSON.stringify({
        success: true,
        status: 'paid',
        paid: true,
        balance: updatedUser?.balance ?? user.balance,
      }), { status: 200, headers: CORS });
    }

    return new Response(JSON.stringify({
      success: true,
      status: status,
      paid: false,
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    console.error('PIX status error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao consultar status' }), { status: 500, headers: CORS });
  }
};
