import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthAdmin(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  const user = await env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
  if (!user || user.role !== 'admin') return null;
  return user;
}

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('Origin') || 'https://docmaster.store';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const notifications = await env.DB.prepare(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    ).all<any>();

    return new Response(JSON.stringify({
      success: true,
      notifications: notifications.results || []
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const { title, message, type, target_role } = body;

    if (!title || !message) {
      return new Response(JSON.stringify({ success: false, error: 'title e message são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO notifications (id, title, message, type, target_role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
    ).bind(id, title, message, type || 'info', target_role || 'all').run();

    return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request) });
};
