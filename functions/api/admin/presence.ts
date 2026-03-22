/**
 * /api/admin/presence — GET: Lista presença de todos os usuários
 * Mostra quem está online, página atual e ação em andamento
 */
import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthAdmin(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  const user = await env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
  if (!user || user.role !== 'admin') return null;
  return user;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    // Mark users as offline if last_seen > 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    await env.DB.prepare(
      'UPDATE user_presence SET is_online = 0 WHERE last_seen < ?'
    ).bind(twoMinutesAgo).run();

    // Get all presence data joined with user info
    const presence = await env.DB.prepare(`
      SELECT up.*, u.username, u.email, u.role, u.profile_photo
      FROM user_presence up
      LEFT JOIN users u ON CAST(up.user_id AS TEXT) = CAST(u.id AS TEXT)
      ORDER BY up.is_online DESC, up.last_seen DESC
    `).all<any>();

    const onlineCount = (presence.results || []).filter((p: any) => p.is_online === 1).length;

    return new Response(JSON.stringify({
      success: true,
      presence: presence.results || [],
      online_count: onlineCount,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
