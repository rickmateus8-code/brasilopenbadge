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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const pricing = await env.DB.prepare(
      'SELECT document_type, display_name, price, is_active, updated_at FROM document_pricing ORDER BY document_type'
    ).all<any>();

    return new Response(JSON.stringify({
      success: true,
      pricing: pricing.results || []
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const { document_type, price, display_name, is_active } = body;

    if (!document_type || price === undefined) {
      return new Response(JSON.stringify({ success: false, error: 'document_type e price são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    // Upsert pricing
    await env.DB.prepare(
      `INSERT INTO document_pricing (document_type, display_name, price, is_active, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(document_type) DO UPDATE SET
         display_name = excluded.display_name,
         price = excluded.price,
         is_active = excluded.is_active,
         updated_at = datetime('now')`
    // price recebido em centavos (ex: 500 = R$5,00), armazenar como recebido
    ).bind(document_type, display_name || document_type, Math.round(price), is_active !== false ? 1 : 0).run();

    // Log action
    const logId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(logId, admin.id, 'update_pricing', 'pricing', document_type, JSON.stringify({ price, display_name })).run().catch(() => null);

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
