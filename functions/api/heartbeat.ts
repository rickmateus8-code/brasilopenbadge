/**
 * /api/heartbeat — POST: Registra heartbeat de presença do usuário
 * Armazena página atual, ação em andamento e timestamp
 */
import type { Env } from '../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const token = getSessionToken(request);
    if (!token) {
      return new Response(JSON.stringify({ success: false }), { status: 401, headers: corsHeaders });
    }

    const session = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first<any>();
    if (!session) {
      return new Response(JSON.stringify({ success: false }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json<any>();
    const currentPage = body.current_page || '/dashboard';
    const currentAction = body.current_action || 'navegando';
    const now = new Date().toISOString();

    // Upsert into user_presence table
    await env.DB.prepare(`
      INSERT INTO user_presence (user_id, current_page, current_action, last_seen, is_online)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(user_id) DO UPDATE SET
        current_page = excluded.current_page,
        current_action = excluded.current_action,
        last_seen = excluded.last_seen,
        is_online = 1
    `).bind(session.user_id, currentPage, currentAction, now).run();

    // Buscar saldo atualizado para retorno em tempo real
    const user = await env.DB.prepare(
      'SELECT balance FROM users WHERE id = ? LIMIT 1'
    ).bind(session.user_id).first<{ balance: number }>();

    return new Response(JSON.stringify({ 
      success: true,
      balance: user?.balance ?? 0
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
