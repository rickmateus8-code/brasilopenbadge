import type { Env } from '../../types';

const getCorsHeaders = (request: Request) => ({
  'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
});

function getSessionToken(request: Request): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('docmaster_session='));
  return match ? match.split('=')[1] : null;
}

async function getAuthUser(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  return env.DB.prepare(
    'SELECT id, username, email, display_name, role, balance, is_active, profile_photo FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'docmaster_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        balance: user.balance,
        profilePhoto: user.profile_photo,
      }
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const { displayName, email, profilePhoto, currentPassword, newPassword } = body;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return new Response(JSON.stringify({ success: false, error: 'Senha atual necessária' }), { status: 400, headers: corsHeaders });
      }
      const currentHash = await hashPassword(currentPassword);
      const dbUser = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first<any>();
      if (!dbUser || dbUser.password_hash !== currentHash) {
        return new Response(JSON.stringify({ success: false, error: 'Senha atual incorreta' }), { status: 400, headers: corsHeaders });
      }
      const newHash = await hashPassword(newPassword);
      await env.DB.prepare(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(newHash, user.id).run();
    }

    // Update profile fields
    const updates: string[] = [];
    const values: any[] = [];

    if (displayName !== undefined) {
      updates.push('display_name = ?');
      values.push(displayName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (profilePhoto !== undefined) {
      updates.push('profile_photo = ?');
      values.push(profilePhoto);
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(user.id);
      await env.DB.prepare(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run();
    }

    // Return updated user
    const updatedUser = await env.DB.prepare(
      'SELECT id, username, email, display_name, role, balance, profile_photo FROM users WHERE id = ?'
    ).bind(user.id).first<any>();

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        role: updatedUser.role,
        balance: updatedUser.balance,
        profilePhoto: updatedUser.profile_photo,
      }
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request) });
};
