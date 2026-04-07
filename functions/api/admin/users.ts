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
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
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

async function logAdminAction(env: Env, adminId: string, action: string, targetId: string, details: object) {
  try {
    await env.DB.prepare(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, 'user', ?, ?, datetime('now'))`
    ).bind(generateId(), adminId, action, targetId, JSON.stringify(details)).run();
  } catch (_) { /* silently fail if table doesn't exist */ }
}

// GET: List all users (with optional plain_password for admin view)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const showPasswords = url.searchParams.get('show_passwords') === '1';

  // Log access to passwords (security audit)
  if (showPasswords) {
    await logAdminAction(env, admin.id, 'view_passwords', 'all', { admin: admin.username });
  }

  const fields = showPasswords
    ? 'u.id, u.username, u.email, u.display_name, u.role, u.balance, u.is_active, u.created_at, u.plain_password'
    : 'u.id, u.username, u.email, u.display_name, u.role, u.balance, u.is_active, u.created_at';

  const result = await env.DB.prepare(
    `SELECT ${fields},
       (SELECT rs.cashback_percentage FROM referral_settings rs WHERE CAST(rs.user_id AS TEXT) = CAST(u.id AS TEXT) LIMIT 1) as cashback_percentage,
       (SELECT rs.referral_percentage FROM referral_settings rs WHERE CAST(rs.user_id AS TEXT) = CAST(u.id AS TEXT) LIMIT 1) as referral_percentage
     FROM users u ORDER BY u.created_at DESC`
  ).all<any>();

  // Map plain_password to the field name expected by the frontend
  const users = (result.results || []).map((u: any) => ({
    ...u,
    plain_password: showPasswords ? (u.plain_password || null) : undefined,
  }));

  return new Response(JSON.stringify({ success: true, users }), { status: 200, headers: corsHeaders });
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

    // Sanitize username
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUsername) {
      return new Response(JSON.stringify({ success: false, error: 'Username inválido' }), { status: 400, headers: corsHeaders });
    }

    // Check if username already exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(cleanUsername).first();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'Username já existe' }), { status: 409, headers: corsHeaders });
    }

    const id = generateId();
    const hashedPassword = await hashPassword(password);
    const userRole = role === 'admin' ? 'admin' : 'user';
    const userBalance = typeof balance === 'number' ? balance : 0;

    await env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, plain_password, display_name, email, role, balance, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
    ).bind(id, cleanUsername, hashedPassword, password, display_name || cleanUsername, email || '', userRole, userBalance).run();

    await logAdminAction(env, admin.id, 'create_user', id, { username: cleanUsername, role: userRole });

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

    const changes: string[] = [];

    // Update password if provided
    if (new_password) {
      if (new_password.length < 4) {
        return new Response(JSON.stringify({ success: false, error: 'Senha deve ter no mínimo 4 caracteres' }), { status: 400, headers: corsHeaders });
      }
      const hashedPassword = await hashPassword(new_password);
      // Update both hash and plain text
      await env.DB.prepare('UPDATE users SET password_hash = ?, plain_password = ? WHERE id = ?')
        .bind(hashedPassword, new_password, user_id).run();
      changes.push('password');
    }

    // Update other fields if provided
    if (display_name !== undefined) {
      await env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(display_name, user_id).run();
      changes.push('display_name');
    }
    if (email !== undefined) {
      await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(email, user_id).run();
      changes.push('email');
    }
    if (role !== undefined) {
      const validRole = role === 'admin' ? 'admin' : 'user';
      await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(validRole, user_id).run();
      changes.push('role');
    }
    if (balance !== undefined) {
      await env.DB.prepare('UPDATE users SET balance = ? WHERE id = ?').bind(balance, user_id).run();
      changes.push('balance');
    }
    if (is_active !== undefined) {
      await env.DB.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(is_active ? 1 : 0, user_id).run();
      changes.push('is_active');
    }

    await logAdminAction(env, admin.id, 'update_user', user_id, { username: user.username, changes });

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

    const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(userId).first<any>();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    }

    // Cannot delete admin itself
    if (String(user.id) === String(admin.id)) {
      return new Response(JSON.stringify({ success: false, error: 'Não é possível excluir o próprio usuário admin' }), { status: 400, headers: corsHeaders });
    }

    // Extra protection: cannot delete another admin without explicit confirmation
    if (user.role === 'admin') {
      const confirmHeader = request.headers.get('X-Confirm-Delete-Admin');
      if (confirmHeader !== 'yes') {
        return new Response(JSON.stringify({ success: false, error: 'Para excluir um admin, envie o header X-Confirm-Delete-Admin: yes' }), { status: 400, headers: corsHeaders });
      }
    }

    // Delete all user data in order
    const tables = [
      'sessions', 'atestados', 'receitas', 'cnhs', 'chas', 'toxicologicos',
      'historicos_sp', 'historicos_uninter', 'documents', 'cashback_earnings',
      'referral_codes', 'notifications', 'presence', 'attestations', 'transactions'
    ];
    for (const table of tables) {
      try {
        await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId).run();
      } catch (_) { /* table may not exist */ }
    }

    // Delete the user itself
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    await logAdminAction(env, admin.id, 'delete_user', userId, { username: user.username });

    return new Response(JSON.stringify({ success: true, message: `Usuário "${user.username}" excluído com sucesso` }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('[admin/users DELETE]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://docmaster.store',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
};
