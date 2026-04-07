import type { Env } from '../../../../types';

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
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = await getAuthAdmin(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { id } = params as { id: string };
  const userId = parseInt(id);
  if (!userId || isNaN(userId)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid user ID' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const db = env.DB;

    // Get attestations
    const attestations = await db.prepare(
      `SELECT id, 'atestado' as type, paciente as nome, created_at, status, codigo_qr
       FROM attestations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // Get other documents
    const documents = await db.prepare(
      `SELECT id, document_type as type, nome, created_at, status
       FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // Combine and sort
    const history = [
      ...(attestations.results || []),
      ...(documents.results || []),
    ].sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }).slice(0, 30);

    return new Response(JSON.stringify({ success: true, history }), {
      headers: corsHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
