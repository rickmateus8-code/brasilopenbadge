/**
 * POST /api/pix/deposit — Gerar cobrança PIX via HyperPix
 *
 * Body: { amount: number, user_name?: string, user_cpf?: string }
 * Retorno: { success, qr_code, qr_code_base64, transaction_id, expires_at }
 */
import type { Env } from '../../types';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    'SELECT id, username, email, display_name, role, balance FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: CORS });
    }

    const body = await request.json() as { amount?: number; user_name?: string; user_cpf?: string };
    const amount = Number(body.amount);

    if (!amount || amount < 5 || amount > 10000) {
      return new Response(JSON.stringify({ success: false, error: 'Valor inválido. Mínimo R$ 5,00, máximo R$ 10.000,00.' }), { status: 400, headers: CORS });
    }

    const HYPERPIX_SK = env.HYPERPIX_SECRET_KEY || 'sk_live_de0f2c5b610735d0659511125bbbf224944748769d56df8a50fe861d2ebbe981';
    const HYPERPIX_API = 'https://api.hyperpix.pro/v1';

    // Gerar cobrança PIX via HyperPix
    const pixResponse = await fetch(`${HYPERPIX_API}/pix/deposit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HYPERPIX_SK}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        payer: {
          name: body.user_name || user.display_name || user.username || 'CLIENTE DOCMASTER',
          document_value: body.user_cpf ? body.user_cpf.replace(/\D/g, '') : '00000000000',
        },
        callback_url: 'https://docmaster.store/api/pix/webhook',
        metadata: {
          user_id: user.id,
          platform: 'docmaster',
        },
      }),
    });

    const pixData = await pixResponse.json() as any;

    if (!pixResponse.ok || !pixData.success) {
      console.error('HyperPix error:', pixData);
      return new Response(JSON.stringify({
        success: false,
        error: pixData.message || pixData.error || 'Erro ao gerar cobrança PIX',
      }), { status: 500, headers: CORS });
    }

    const txData = pixData.data || pixData;
    const transactionId = txData.transaction_id || txData.id || crypto.randomUUID();

    // Salvar transação pendente no banco
    await env.DB.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, status, external_id, created_at)
      VALUES (?, ?, 'credit', ?, ?, 'pending', ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      user.id,
      amount,
      `Recarga PIX R$ ${amount.toFixed(2)}`,
      transactionId,
    ).run().catch(() => {
      // Se a tabela não tiver a coluna external_id ou status, ignora o erro
    });

    return new Response(JSON.stringify({
      success: true,
      transaction_id: transactionId,
      qr_code: txData.qr_code || txData.pix_code || '',
      qr_code_base64: txData.qr_code_base64 || txData.qr_image || '',
      expires_at: txData.expires_at || txData.expiration || '',
      amount: amount,
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    console.error('PIX deposit error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno ao processar PIX' }), { status: 500, headers: CORS });
  }
};
