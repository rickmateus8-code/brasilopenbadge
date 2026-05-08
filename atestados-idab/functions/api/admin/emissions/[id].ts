import type { Env } from '../../../types';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

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
  return user?.role === 'admin' ? user : null;
}

async function logAdminAction(env: Env, adminId: string, action: string, targetType: string, targetId: string, details: any) {
  try {
    await env.DB.prepare(`
      INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(crypto.randomUUID(), adminId, action, targetType, targetId, JSON.stringify(details)).run();
  } catch {}
}

function resolveSource(source: string | null) {
  if (source === 'attestations') return { table: 'attestations', type: 'atestado', editPath: (id: string) => `/atestado/editar/${id}?admin=1` };
  if (source === 'receitas') return { table: 'receitas', type: 'receita', editPath: (id: string) => `/receita/editar/${id}?admin=1` };
  return { table: 'documents', type: 'document', editPath: (id: string, docType?: string) => `/${docType || 'documents'}/editar/${id}?admin=1` };
}

function parseData(value: any) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const source = resolveSource(url.searchParams.get('source'));
    const docId = String(params.id || '');

    const row = await env.DB.prepare(`SELECT * FROM ${source.table} WHERE id = ? LIMIT 1`).bind(docId).first<any>();
    if (!row) {
      return new Response(JSON.stringify({ success: false, error: 'Documento não encontrado' }), { status: 404, headers: corsHeaders });
    }

    const docType = row.type || source.type;
    const payload = source.table === 'documents' ? parseData(row.data) : row;

    return new Response(JSON.stringify({
      success: true,
      source: source.table,
      document_type: docType,
      document: row,
      payload,
      edit_path: source.table === 'documents' ? source.editPath(docId, docType) : source.editPath(docId),
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const docId = String(params.id || '');
    const url = new URL(request.url);
    const source = resolveSource(url.searchParams.get('source'));
    const hardDelete = url.searchParams.get('hard') === 'true';

    const existing = await env.DB.prepare(`SELECT id, status, user_id${source.table === 'documents' ? ', type' : ''} FROM ${source.table} WHERE id = ? LIMIT 1`).bind(docId).first<any>();
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: 'Documento não encontrado' }), { status: 404, headers: corsHeaders });
    }

    if (hardDelete) {
      await env.DB.prepare(`DELETE FROM ${source.table} WHERE id = ?`).bind(docId).run();
    } else {
      await env.DB.prepare(`UPDATE ${source.table} SET status = 'cancelado' WHERE id = ?`).bind(docId).run();
    }

    await logAdminAction(
      env,
      admin.id,
      hardDelete ? 'hard_delete_emission' : 'cancel_emission',
      source.table,
      docId,
      {
        source: source.table,
        hard_delete: hardDelete,
        target_user_id: existing.user_id,
        document_type: existing.type || source.type,
      }
    );

    return new Response(JSON.stringify({
      success: true,
      message: hardDelete ? 'Documento excluído permanentemente' : 'Documento cancelado com sucesso',
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
