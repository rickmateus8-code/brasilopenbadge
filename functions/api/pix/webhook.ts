/**
 * POST /api/pix/webhook — Webhook de confirmação de pagamento PIX (HyperPix)
 *
 * Recebe notificação do HyperPix quando um pagamento é confirmado.
 * Credita o saldo do usuário automaticamente.
 */
import type { Env } from '../../types';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as any;

    // HyperPix envia: { event: "payment.confirmed", data: { transaction_id, amount, metadata: { user_id } } }
    const event = body.event || body.type || body.status;
    const data = body.data || body;

    const transactionId = data.transaction_id || data.id;
    const amount = Number(data.amount || 0);
    const userId = data.metadata?.user_id || data.user_id;

    // Aceitar apenas eventos de pagamento confirmado
    const isConfirmed = ['payment.confirmed', 'paid', 'completed', 'approved', 'PAID'].includes(event);

    if (!isConfirmed || !transactionId || !amount || !userId) {
      return new Response(JSON.stringify({ received: true, processed: false }), { status: 200, headers: CORS });
    }

    // Verificar se já foi processado (idempotência)
    const existing = await env.DB.prepare(
      "SELECT id FROM transactions WHERE external_id = ? AND status = 'completed'"
    ).bind(transactionId).first<any>().catch(() => null);

    if (existing) {
      return new Response(JSON.stringify({ received: true, processed: false, reason: 'already_processed' }), { status: 200, headers: CORS });
    }

    // Creditar saldo do usuário
    await env.DB.prepare(
      'UPDATE users SET balance = balance + ? WHERE id = ?'
    ).bind(amount, userId).run();

    // Atualizar status da transação
    await env.DB.prepare(
      "UPDATE transactions SET status = 'completed' WHERE external_id = ?"
    ).bind(transactionId).run().catch(() => {
      // Se não encontrar, inserir nova transação
      return env.DB.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, description, status, external_id, created_at)
        VALUES (?, ?, 'credit', ?, ?, 'completed', ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        userId,
        amount,
        `Recarga PIX R$ ${amount.toFixed(2)} - Confirmado`,
        transactionId,
      ).run().catch(() => {});
    });

    return new Response(JSON.stringify({ received: true, processed: true }), { status: 200, headers: CORS });

  } catch (err: any) {
    console.error('PIX webhook error:', err);
    return new Response(JSON.stringify({ received: true, processed: false, error: 'Internal error' }), { status: 200, headers: CORS });
  }
};
