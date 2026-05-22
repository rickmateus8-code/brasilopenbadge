import type { Env } from '../../types';

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await request.json() as any;
    const { username, password, email, displayName } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    // Check if user exists
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)'
    ).bind(username.trim(), (email || '').trim()).first();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário ou email já cadastrado' }), { status: 400, headers: corsHeaders });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const defaultPermissions = JSON.stringify({
      editaveis: ["atestado", "cnh", "cha", "toxicologico", "receita"],
      ferramentas: ["bot-adv", "peticao-stj"]
    });

    await env.DB.prepare(
      'INSERT INTO users (id, username, password_hash, email, display_name, role, balance, is_active, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, username.trim(), passwordHash, email || '', displayName || username, 'user', 0, 1, defaultPermissions, now).run();

    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionToken, id, expiresAt).run();

    const responseData = {
      success: true,
      user: {
        id,
        username,
        email: email || '',
        displayName: displayName || username,
        role: 'user',
        balance: 0,
        permissions: JSON.parse(defaultPermissions),
      }
    };

    const headers = new Headers(corsHeaders);
    headers.set('Set-Cookie', `docmaster_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);

    return new Response(JSON.stringify(responseData), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request.headers.get('Origin')) });
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
