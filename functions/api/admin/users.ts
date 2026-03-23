import type { Env } from '../../types';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "docmaster_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// GET: List all users
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  const result = await env.DB.prepare(
    'SELECT id, username, email, display_name, role, balance, is_active, created_at FROM users ORDER BY created_at DESC'
  ).all<any>();

  return new Response(JSON.stringify({ success: true, users: result.results || [] }), { status: 200, headers: corsHeaders });
};

// POST: Create new user
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  try {
    const body = await request.json() as any;
    const { username, password, display_name, email, role, balance } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Username e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    if (password.length < 4) {
      return new Response(JSON.stringify({ success: false, error: 'Senha deve ter no mínimo 4 caracteres' }), { status: 400, headers: corsHeaders });
    }

    // Check if username already exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'Username já existe' }), { status: 409, headers: corsHeaders });
    }

    const id = generateId();
    const hashedPassword = await hashPassword(password);
    const userRole = role === 'admin' ? 'admin' : 'user';
    const userBalance = typeof balance === 'number' ? balance : 0;

    await env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, display_name, email, role, balance, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
    ).bind(id, username, hashedPassword, display_name || username, email || '', userRole, userBalance).run();

    // Log action
    await env.DB.prepare(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
       VALUES (?, ?, 'create_user', 'user', ?, ?, datetime('now'))`
    ).bind(generateId(), admin.id, id, JSON.stringify({ username, role: userRole })).run();

    return new Response(JSON.stringify({ success: true, message: 'Usuário criado com sucesso', userId: id }), { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error('[admin/users POST]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

// PUT: Update user password
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  try {
    const body = await request.json() as any;
    const { user_id, new_password } = body;

    if (!user_id || !new_password) {
      return new Response(JSON.stringify({ success: false, error: 'user_id e new_password são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    if (new_password.length < 4) {
      return new Response(JSON.stringify({ success: false, error: 'Senha deve ter no mínimo 4 caracteres' }), { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT id, username FROM users WHERE id = ?').bind(user_id).first<any>();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    }

    const hashedPassword = await hashPassword(new_password);
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hashedPassword, user_id).run();

    // Log action
    await env.DB.prepare(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
       VALUES (?, ?, 'change_password', 'user', ?, ?, datetime('now'))`
    ).bind(generateId(), admin.id, user_id, JSON.stringify({ username: user.username })).run();

    return new Response(JSON.stringify({ success: true, message: 'Senha alterada com sucesso' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('[admin/users PUT]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
