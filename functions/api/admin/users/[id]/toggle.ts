import type { Env } from '../../../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAdminUser(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  const user = await env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
  return user?.role === 'admin' ? user : null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  const userId = params.id;
  const user = await env.DB.prepare('SELECT id, is_active FROM users WHERE id = ?').bind(userId).first<any>();
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
  }

  const newActive = user.is_active ? 0 : 1;
  await env.DB.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(newActive, userId).run();

  return new Response(JSON.stringify({ success: true, is_active: newActive }), { status: 200, headers: corsHeaders });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
