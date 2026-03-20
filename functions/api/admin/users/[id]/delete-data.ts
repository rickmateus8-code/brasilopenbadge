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
  'Access-Control-Allow-Origin': '*',
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

    const userId = params.id as string;
    const body = await request.json() as any;
    const { confirm, delete_user } = body;

    if (!confirm) {
      return new Response(JSON.stringify({ success: false, error: 'Confirmação necessária' }), { status: 400, headers: corsHeaders });
    }

    // Delete user documents/attestations
    await env.DB.prepare('DELETE FROM attestations WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM documents WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM transactions WHERE user_id = ?').bind(userId).run();

    if (delete_user) {
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    }

    // Log action
    const logId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(logId, admin.id, delete_user ? 'delete_user' : 'delete_user_data', 'user', userId, JSON.stringify({ delete_user })).run();

    return new Response(JSON.stringify({
      success: true,
      message: delete_user ? 'Usuário e dados excluídos' : 'Dados do usuário excluídos'
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
