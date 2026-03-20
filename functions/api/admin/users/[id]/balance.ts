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

  try {
    const userId = params.id;
    const body = await request.json() as { delta: number };
    const { delta } = body;

    if (typeof delta !== 'number') {
      return new Response(JSON.stringify({ success: false, error: 'Delta inválido' }), { status: 400, headers: corsHeaders });
    }

    await env.DB.prepare(
      'UPDATE users SET balance = MAX(0, balance + ?) WHERE id = ?'
    ).bind(delta, userId).run();

    // Record transaction
    const type = delta > 0 ? 'credit' : 'debit';
    const amount = Math.abs(delta);
    const description = delta > 0
      ? `Crédito manual pelo administrador`
      : `Débito manual pelo administrador`;

    await env.DB.prepare(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)'
    ).bind(userId, type, amount, description).run();

    const updatedUser = await env.DB.prepare(
      'SELECT id, username, balance FROM users WHERE id = ?'
    ).bind(userId).first<any>();

    return new Response(JSON.stringify({ success: true, user: updatedUser }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
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
