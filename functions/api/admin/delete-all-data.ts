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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const { confirm, confirmation_text } = body;

    if (!confirm || confirmation_text !== 'EXCLUIR TUDO') {
      return new Response(JSON.stringify({ success: false, error: 'Confirmação inválida. Digite EXCLUIR TUDO' }), { status: 400, headers: corsHeaders });
    }

    // Delete all documents and attestations (keep users and transactions for audit)
    await env.DB.prepare('DELETE FROM attestations').run();
    await env.DB.prepare('DELETE FROM documents').run();

    // Log action
    const logId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(logId, admin.id, 'delete_all_data', 'global', 'all', JSON.stringify({ admin: admin.username })).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Todos os dados de documentos foram excluídos'
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
