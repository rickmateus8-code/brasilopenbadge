import type { Env } from '../../types';

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const token = getSessionToken(request);
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    const session = await env.DB.prepare(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first<any>();

    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão inválida' }), { status: 401, headers: corsHeaders });
    }

    const user = await env.DB.prepare(
      'SELECT id, username, email, display_name, role, balance, is_active, profile_photo, permissions, free_documents FROM users WHERE id = ? AND is_active = 1'
    ).bind(session.user_id).first<any>();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 401, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        displayName: user.display_name || user.username,
        role: user.role,
        balance: typeof user.balance === 'number' ? user.balance : (parseInt(String(user.balance ?? '0'), 10) || 0),
        profilePhoto: user.profile_photo || null,
        permissions: user.permissions || '{"editaveis":[],"ferramentas":[]}',
        free_documents: JSON.parse(user.free_documents || '[]'),
      }
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request.headers.get('Origin')) });
};

function getSessionToken(request: Request): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;
  // Parser de cookie mais robusto
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('docmaster_session='));
  return match ? match.split('=')[1] : null;
}
