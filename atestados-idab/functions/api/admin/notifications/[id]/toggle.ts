import type { Env } from '../../../../types';

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
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const id = params.id as string;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID não fornecido' }), { status: 400, headers: corsHeaders });
    }

    // Get current state
    const notification = await env.DB.prepare(
      'SELECT is_active FROM notifications WHERE id = ?'
    ).bind(id).first<any>();

    if (!notification) {
      return new Response(JSON.stringify({ success: false, error: 'Aviso não encontrado' }), { status: 404, headers: corsHeaders });
    }

    // Toggle
    const newState = notification.is_active ? 0 : 1;
    await env.DB.prepare(
      'UPDATE notifications SET is_active = ? WHERE id = ?'
    ).bind(newState, id).run();

    return new Response(JSON.stringify({
      success: true,
      message: newState ? 'Aviso ativado' : 'Aviso desativado',
      is_active: newState,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
