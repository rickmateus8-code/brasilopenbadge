/**
 * /api/admin/emissions/[id] — DELETE: Exclui um documento (admin only)
 * Suporta attestations, receitas e documents
 */
import type { Env } from '../../../types';

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
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const docId = params.id as string;
    const url = new URL(request.url);
    const tableSource = url.searchParams.get('source') || 'documents';
    const hardDelete = url.searchParams.get('hard') === 'true';

    let tableName = 'documents';
    if (tableSource === 'attestations') tableName = 'attestations';
    else if (tableSource === 'receitas') tableName = 'receitas';

    if (hardDelete) {
      // Hard delete - remove from database
      await env.DB.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(docId).run();
    } else {
      // Soft delete - mark as cancelled
      await env.DB.prepare(`UPDATE ${tableName} SET status = 'cancelado' WHERE id = ?`).bind(docId).run();
    }

    // Log the action
    const logId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId, admin.id, hardDelete ? 'hard_delete_document' : 'cancel_document',
      tableName, docId,
      JSON.stringify({ admin: admin.username, table: tableName, hard: hardDelete }),
      new Date().toISOString()
    ).run().catch(() => null);

    return new Response(JSON.stringify({
      success: true,
      message: hardDelete ? 'Documento excluído permanentemente' : 'Documento cancelado com sucesso',
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
