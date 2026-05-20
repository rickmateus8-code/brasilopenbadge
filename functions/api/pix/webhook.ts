/**
 * POST /api/pix/webhook — Webhook de confirmação de pagamento PIX (Payments Black)
 *
 * Recebe notificação do Payments Black quando um pagamento é confirmado.
 * Credita o saldo do usuário automaticamente.
 */
import type { Env } from '../../types';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function toJson(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function toCents(value: any) {
  return Math.round(Number(value || 0) * 100);
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const providedSecret = url.searchParams.get('secret');
    const expectedSecret = (env as any).PAYMENTS_BLACK_WEBHOOK_SECRET || 'webhook_secret_key';

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.error('PIX webhook error: Invalid or missing secret');
      return toJson({ received: true, processed: false, error: 'Unauthorized' }, 401);
    }

    const body = await request.json() as any;

    const transactionId = String(body.transaction_id || body.payment_id || '').trim();
    const gatewayStatus = String(body.status || '').toUpperCase();
    const isConfirmed = gatewayStatus === 'COMPLETED';

    if (!transactionId || !isConfirmed) {
      return toJson({ received: true, processed: false });
    }

    const existing = await env.DB.prepare(
      "SELECT id, user_id, amount, status FROM transactions WHERE external_id = ? LIMIT 1"
    ).bind(transactionId).first<any>().catch(() => null);

    const userId = body.metadata?.user_id || existing?.user_id;
    const amountCents = existing?.amount ? Number(existing.amount) : toCents(body.amount);

    if (!userId || !amountCents) {
      return toJson({ received: true, processed: false, reason: 'missing_user_or_amount' });
    }

    if (existing?.status === 'completed') {
      return toJson({ received: true, processed: false, reason: 'already_processed' });
    }

    await env.DB.prepare(
      'UPDATE users SET balance = balance + ? WHERE id = ?'
    ).bind(amountCents, userId).run();

    if (existing) {
      await env.DB.prepare(
        "UPDATE transactions SET status = 'completed' WHERE external_id = ?"
      ).bind(transactionId).run().catch(() => {});
    } else {
      await env.DB.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, status, external_id, created_at)
        VALUES (?, 'credit', ?, ?, 'completed', ?, datetime('now'))
      `).bind(
        userId,
        amountCents,
        `Recarga PIX R$ ${(amountCents / 100).toFixed(2).replace('.', ',')} - Confirmado`,
        transactionId,
      ).run().catch(() => {});
    }

    return toJson({ received: true, processed: true });
  } catch (err: any) {
    console.error('PIX webhook error:', err);
    return toJson({ received: true, processed: false, error: 'Internal error' });
  }
};
