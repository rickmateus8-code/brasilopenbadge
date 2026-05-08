import type { Env } from '../types';

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
    'SELECT id, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    const notifications = await env.DB.prepare(
      `SELECT id, title, message, type, created_at FROM notifications
       WHERE is_active = 1 AND (target_role = 'all' OR target_role = ?)
       ORDER BY created_at DESC LIMIT 10`
    ).bind(user.role).all<any>();

    return new Response(JSON.stringify({
      success: true,
      notifications: notifications.results || []
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
