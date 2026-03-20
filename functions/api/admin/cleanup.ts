/**
 * /api/admin/cleanup — Limpeza automática de documentos com mais de 60 dias
 * 
 * Regra: Documentos emitidos há mais de 60 dias são automaticamente excluídos.
 * Este endpoint pode ser chamado manualmente pelo admin ou via cron job.
 */

import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthUser(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1'
  ).bind(token).first<{ user_id: string }>();
  if (!session) return null;
  return env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1'
  ).bind(session.user_id).first<any>();
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const user = await getAuthUser(ctx.request, ctx.env);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = ctx.env.DB;
    
    // Excluir atestados com mais de 60 dias
    const attestationsResult = await db.prepare(
      `DELETE FROM attestations WHERE created_at < datetime('now', '-60 days')`
    ).run();

    // Excluir documentos com mais de 60 dias (se tabela existir)
    let documentsDeleted = 0;
    try {
      const docsResult = await db.prepare(
        `DELETE FROM documents WHERE created_at < datetime('now', '-60 days')`
      ).run();
      documentsDeleted = docsResult.meta?.changes || 0;
    } catch {
      // Tabela documents pode não existir
    }

    const attestationsDeleted = attestationsResult.meta?.changes || 0;
    const total = attestationsDeleted + documentsDeleted;

    // Log da operação
    try {
      await db.prepare(
        `INSERT INTO admin_logs (user_id, action, details, created_at) VALUES (?, 'cleanup_60days', ?, datetime('now'))`
      ).bind(user.id, `Excluídos ${total} documentos com mais de 60 dias (${attestationsDeleted} atestados, ${documentsDeleted} outros)`).run();
    } catch {}

    return new Response(JSON.stringify({
      success: true,
      message: `Limpeza concluída. ${total} documentos excluídos.`,
      details: {
        attestations: attestationsDeleted,
        documents: documentsDeleted,
        total,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// GET — Verificar quantos documentos serão excluídos
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const user = await getAuthUser(ctx.request, ctx.env);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = ctx.env.DB;
    
    const attestationsCount = await db.prepare(
      `SELECT COUNT(*) as count FROM attestations WHERE created_at < datetime('now', '-60 days')`
    ).first<{ count: number }>();

    return new Response(JSON.stringify({
      success: true,
      pendingDeletion: {
        attestations: attestationsCount?.count || 0,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
