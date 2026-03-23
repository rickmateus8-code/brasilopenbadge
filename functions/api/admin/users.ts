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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

// GET: List all users (with optional password_hash for admin view)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const showPasswords = url.searchParams.get('show_passwords') === '1';

  const fields = showPasswords
    ? 'id, username, email, display_name, role, balance, is_active, created_at, password_hash'
    : 'id, username, email, display_name, role, balance, is_active, created_at';

  const result = await env.DB.prepare(
    `SELECT ${fields} FROM users ORDER BY created_at DESC`
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

// PUT: Update user (password, role, balance, display_name, email, is_active)
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  try {
    const body = await request.json() as any;
    const { user_id, new_password, display_name, email, role, balance, is_active } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ success: false, error: 'user_id é obrigatório' }), { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT id, username FROM users WHERE id = ?').bind(user_id).first<any>();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    }

    // Update password if provided
    if (new_password) {
      if (new_password.length < 4) {
        return new Response(JSON.stringify({ success: false, error: 'Senha deve ter no mínimo 4 caracteres' }), { status: 400, headers: corsHeaders });
      }
      const hashedPassword = await hashPassword(new_password);
      await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hashedPassword, user_id).run();
    }

    // Update other fields if provided
    if (display_name !== undefined) await env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(display_name, user_id).run();
    if (email !== undefined) await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(email, user_id).run();
    if (role !== undefined) await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, user_id).run();
    if (balance !== undefined) await env.DB.prepare('UPDATE users SET balance = ? WHERE id = ?').bind(balance, user_id).run();
    if (is_active !== undefined) await env.DB.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(is_active ? 1 : 0, user_id).run();

    // Log action
    await env.DB.prepare(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
       VALUES (?, ?, 'update_user', 'user', ?, ?, datetime('now'))`
    ).bind(generateId(), admin.id, user_id, JSON.stringify({ username: user.username })).run();

    return new Response(JSON.stringify({ success: true, message: 'Usuário atualizado com sucesso' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('[admin/users PUT]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

// DELETE: Delete user completely
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'user_id é obrigatório' }), { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT id, username FROM users WHERE id = ?').bind(userId).first<any>();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    }

    // Cannot delete admin itself
    if (String(user.id) === String(admin.id)) {
      return new Response(JSON.stringify({ success: false, error: 'Não é possível excluir o próprio usuário admin' }), { status: 400, headers: corsHeaders });
    }

    // Delete all user data in order
    const tables = [
      'sessions', 'atestados', 'receitas', 'cnhs', 'chas', 'toxicologicos',
      'historicos_sp', 'historicos_uninter', 'documents', 'cashback_earnings',
      'referral_codes', 'notifications', 'presence'
    ];
    for (const table of tables) {
      try {
        await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId).run();
      } catch (_) { /* table may not exist */ }
    }

    // Delete the user itself
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    // Log action
    await env.DB.prepare(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
       VALUES (?, ?, 'delete_user', 'user', ?, ?, datetime('now'))`
    ).bind(generateId(), admin.id, userId, JSON.stringify({ username: user.username })).run();

    return new Response(JSON.stringify({ success: true, message: `Usuário "${user.username}" excluído com sucesso` }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('[admin/users DELETE]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
