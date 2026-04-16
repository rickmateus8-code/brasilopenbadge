/**
 * POST /api/pix/deposit — Gerar cobrança PIX via Payments Black
 *
 * Body: { amount: number, user_name?: string, user_cpf?: string }
 * Retorno: { success, qr_code, qr_code_base64, transaction_id, expires_at, amount }
 */
import type { Env } from '../../types';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const BLACKPAY_API = 'https://api.paymentsblack.com';
const FALLBACK_API_KEY = 'htu*****95';
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
    'SELECT id, username, email, phone, display_name, role, balance FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

function toJson(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function sanitizeCpf(value?: string) {
  return (value || '').replace(/\D/g, '').slice(0, 11);
}

function normalizeAmount(value: number) {
  return Math.round(value * 100) / 100;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return toJson({ success: false, error: 'Não autenticado' }, 401);
    }

    const body = await request.json() as { amount?: number; user_name?: string; user_cpf?: string };
    const amount = normalizeAmount(Number(body.amount || 0));

    if (!amount || amount < 20 || amount > 150) {
      return toJson({
        success: false,
        error: 'Valor inválido. Informe uma recarga entre R$ 20,00 e R$ 150,00.',
      }, 400);
    }

    const amountCents = Math.round(amount * 100);
    const apiKey = (env as any).PAYMENTS_BLACK_API_KEY || FALLBACK_API_KEY;
    const apiSecret = (env as any).PAYMENTS_BLACK_API_SECRET || FALLBACK_API_SECRET;
    const cpf = sanitizeCpf(body.user_cpf);

    const customer: any = {
      name: body.user_name || user.display_name || user.username || 'CLIENTE DOCMASTER',
      email: user.email || 'financeiro@docmaster.store',
    };

    if (user.phone) {
      customer.phone = String(user.phone).replace(/\D/g, '');
    }

    if (cpf.length === 11) {
      customer.document = {
        number: cpf,
        type: 'cpf',
      };
    }

    const externalTransactionId = crypto.randomUUID().replace(/-/g, '');
    const postbackUrl = 'https://docmaster.store/api/pix/webhook';

    const pixResponse = await fetch(`${BLACKPAY_API}/api/v1/pix/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
      },
      body: JSON.stringify({
        amount,
        description: `Recarga de saldo DocMaster — R$ ${amount.toFixed(2)}`,
        customer,
        items: [
          {
            title: 'Recarga de saldo DocMaster',
            unitPrice: amountCents,
            quantity: 1,
          },
        ],
        metadata: {
          user_id: user.id,
          username: user.username || '',
          platform: 'docmaster',
          requested_amount_cents: amountCents,
          external_reference: externalTransactionId,
        },
        postbackUrl,
      }),
    });

    const pixData = await pixResponse.json().catch(() => ({})) as any;

    if (!pixResponse.ok || String(pixData?.status) !== 'true' || !pixData?.paymentData?.transactionId) {
      console.error('Payments Black create PIX error:', {
        status: pixResponse.status,
        payload: pixData,
      });
      return toJson({
        success: false,
        error: pixData?.message || pixData?.error || 'Erro ao gerar cobrança PIX.',
      }, 500);
    }

    const paymentData = pixData.paymentData || {};
    const transactionId = String(paymentData.transactionId);
    const qrCode = paymentData.copiaecola || '';
    const qrBase64 = paymentData.qrcode || '';
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, status, external_id, created_at)
      VALUES (?, ?, 'credit', ?, ?, 'pending', ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      user.id,
      amountCents,
      `Recarga PIX R$ ${amount.toFixed(2).replace('.', ',')}`,
      transactionId,
    ).run().catch((dbErr: any) => {
      console.warn('Não foi possível registrar a transação pendente de PIX:', dbErr);
    });

    return toJson({
      success: true,
      transaction_id: transactionId,
      qr_code: qrCode,
      qr_code_base64: qrBase64,
      expires_at: expiresAt,
      amount,
    });
  } catch (err: any) {
    console.error('PIX deposit error:', err);
    return toJson({ success: false, error: 'Erro interno ao processar PIX' }, 500);
  }
};
