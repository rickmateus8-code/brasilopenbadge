import type { Env } from '../../types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json() as { username: string; password: string; email?: string; displayName?: string };
    const { username, password, email, displayName } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' }), { status: 400, headers: corsHeaders });
    }

    // Check if username already exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username.trim()).first();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'Nome de usuário já está em uso' }), { status: 409, headers: corsHeaders });
    }

    const passwordHash = await hashPassword(password);
    const userId = generateId();

    await env.DB.prepare(
      'INSERT INTO users (id, username, email, display_name, password_hash, role, balance, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, username.trim(), email || null, displayName || username.trim(), passwordHash, 'user', 0, 1).run();

    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionToken, userId, expiresAt).run();

    const responseData = {
      success: true,
      user: {
        id: userId,
        username: username.trim(),
        email: email || '',
        displayName: displayName || username.trim(),
        role: 'user',
        balance: 0,
      }
    };

    const headers = new Headers(corsHeaders);
    headers.set('Set-Cookie', `docmaster_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);

    return new Response(JSON.stringify(responseData), { status: 201, headers });
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

function generateId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
