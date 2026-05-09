import type { Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const token = getSessionToken(request);
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    const session = await env.DB.prepare(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first<any>();

    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão inválida ou expirada' }), { status: 401, headers: corsHeaders });
    }

    const user = await env.DB.prepare(
      'SELECT id, username, email, display_name, role, balance, is_active, profile_photo, permissions FROM users WHERE id = ? AND is_active = 1'
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
        permissions: user.permissions || '{"ferramentas":[]}',
      }
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}
