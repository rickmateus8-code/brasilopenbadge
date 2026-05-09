import type { Env } from '../../types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json() as { username: string; password: string };
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    // Aceita login por username OU email
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND is_active = 1'
    ).bind(username.trim(), username.trim()).first<any>();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado ou inativo' }), { status: 401, headers: corsHeaders });
    }

    // Simple password check (in production use bcrypt)
    const passwordHash = await hashPassword(password);
    if (user.password_hash !== passwordHash) {
      return new Response(JSON.stringify({ success: false, error: 'Senha incorreta' }), { status: 401, headers: corsHeaders });
    }

    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionToken, user.id, expiresAt).run();

    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        displayName: user.display_name || user.username,
        role: user.role,
        balance: user.balance,
        permissions: user.permissions || '{"ferramentas":[]}',
      }
    };

    const headers = new Headers(corsHeaders);
    headers.set('Set-Cookie', `docmaster_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);

    return new Response(JSON.stringify(responseData), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno do servidor' }), { status: 500, headers: corsHeaders });
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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'docmaster_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
