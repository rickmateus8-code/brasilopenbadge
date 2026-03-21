/**
 * /api/documents/[id] — GET, PUT, DELETE para documentos genéricos (CNH, CHA, etc.)
 * Tabela: documents (D1)
 */
import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthUser(env: Env, token: string | null): Promise<any | null> {
  if (!token) return null;
  const now = new Date().toISOString();
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1"
  ).bind(token, now).first<{ user_id: string }>();
  if (!session) return null;
  const user = await env.DB.prepare(
    "SELECT id, username, role, balance, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1"
  ).bind(session.user_id).first<any>();
  return user || null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

export async function onRequest(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;
  const docId = params.id;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const token = getSessionToken(request);
  const user = await getAuthUser(env, token);
  if (!user) {
    return jsonResponse({ success: false, error: "Não autenticado." }, 401);
  }

  try {
    if (request.method === "GET") {
      let doc;
      if (user.role === "admin") {
        doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      } else {
        doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ? AND user_id = ? LIMIT 1").bind(docId, user.id).first<any>();
      }
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);

      // Parse JSON data field
      let parsedData = {};
      try {
        if (doc.data) parsedData = JSON.parse(doc.data);
      } catch { /* ignore */ }

      return jsonResponse({ success: true, data: { ...doc, ...parsedData } });
    }

    if (request.method === "PUT") {
      const doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);
      if (user.role !== "admin" && doc.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }

      const body = await request.json<any>();
      const now = new Date().toISOString();

      // CPF BLOQUEADO — não pode ser alterado após emissão (regra universal)
      let existingData: any = {};
      try { if (doc.data) existingData = JSON.parse(doc.data); } catch { /* ignore */ }
      body.cpf = existingData.cpf; // Preservar CPF original

      await env.DB.prepare(`
        UPDATE documents SET
          data = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(JSON.stringify(body), now, docId).run();

      return jsonResponse({ success: true, message: "Documento atualizado com sucesso." });
    }

    if (request.method === "DELETE") {
      const doc = await env.DB.prepare("SELECT id, user_id FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);
      if (user.role !== "admin" && doc.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }
      await env.DB.prepare("UPDATE documents SET status = 'cancelado', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), docId).run();
      return jsonResponse({ success: true, message: "Documento cancelado com sucesso." });
    }

    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
  } catch (error) {
    console.error("[documents/[id]] Erro:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Erro interno." }, 500);
  }
}
