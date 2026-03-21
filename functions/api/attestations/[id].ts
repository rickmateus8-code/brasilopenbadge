/**
 * /api/attestations/[id] — Proxy para o handler principal de attestations
 * Suporta GET (buscar por ID), PUT (editar), DELETE (excluir)
 */

import type { Env } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function onRequest(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;
  const attestationId = params.id;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const token = getSessionToken(request);
  const user = await getAuthUser(env, token);
  if (!user) {
    return jsonResponse({ success: false, error: "Não autenticado." }, 401);
  }

  try {
    // ── GET — Buscar atestado por ID ──────────────────────────────────────
    if (request.method === "GET") {
      const isAdmin = user.role === "admin";
      let row;
      if (isAdmin) {
        row = await env.DB.prepare("SELECT * FROM attestations WHERE id = ? LIMIT 1")
          .bind(attestationId).first();
      } else {
        row = await env.DB.prepare("SELECT * FROM attestations WHERE id = ? AND user_id = ? LIMIT 1")
          .bind(attestationId, user.id).first();
      }
      if (!row) {
        return jsonResponse({ success: false, error: "Atestado não encontrado." }, 404);
      }
      return jsonResponse({ success: true, data: row });
    }

    // ── PUT — Editar atestado (CPF bloqueado) ─────────────────────────────
    if (request.method === "PUT") {
      // Verificar se o atestado existe e pertence ao usuário
      const existing = await env.DB.prepare(
        "SELECT id, user_id, cpf FROM attestations WHERE id = ? LIMIT 1"
      ).bind(attestationId).first<any>();

      if (!existing) {
        return jsonResponse({ success: false, error: "Atestado não encontrado." }, 404);
      }
      if (existing.user_id !== user.id && user.role !== "admin") {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }

      const body = await request.json() as any;

      // CPF BLOQUEADO — não pode ser alterado
      if (body.cpf && body.cpf !== existing.cpf) {
        return jsonResponse({ success: false, error: "CPF não pode ser alterado após emissão." }, 400);
      }

      // Atualizar campos permitidos
      await env.DB.prepare(`
        UPDATE attestations SET
          instituicao = ?,
          unidade = ?,
          endereco_emitente = ?,
          medico = ?,
          crm = ?,
          especialidade = ?,
          paciente = ?,
          sexo = ?,
          nascimento = ?,
          nome_mae = ?,
          endereco = ?,
          cid = ?,
          cid_display = ?,
          cid_nome = ?,
          afastamento = ?,
          texto_atestado = ?,
          data_assinatura = ?,
          hora_assinatura = ?,
          data_emissao = ?,
          cidade = ?,
          logo_url = ?,
          logo_right = ?,
          signature_color = ?,
          signature_image = ?,
          modo_carimbo = ?
        WHERE id = ?
      `).bind(
        body.instituicao || existing.instituicao || "",
        body.unidade || existing.unidade || "",
        body.endereco_emitente || existing.endereco_emitente || "",
        body.medico || existing.medico || "",
        body.crm || existing.crm || "",
        body.especialidade || existing.especialidade || "",
        body.paciente || existing.paciente || "",
        body.sexo || existing.sexo || "",
        body.nascimento || existing.nascimento || "",
        body.nome_mae || existing.nome_mae || "",
        body.endereco || existing.endereco || "",
        body.cid || existing.cid || "",
        body.cid_display || existing.cid_display || "",
        body.cid_nome || existing.cid_nome || "",
        body.afastamento || existing.afastamento || "",
        body.texto_atestado || existing.texto_atestado || "",
        body.data_assinatura || existing.data_assinatura || "",
        body.hora_assinatura || existing.hora_assinatura || "",
        body.data_emissao || existing.data_emissao || "",
        body.cidade || existing.cidade || "",
        body.logo_url || existing.logo_url || "",
        body.logo_right || existing.logo_right || "",
        body.signature_color || existing.signature_color || "",
        body.signature_image || existing.signature_image || "",
        body.modo_carimbo !== undefined ? (body.modo_carimbo ? 1 : 0) : (existing.modo_carimbo || 0),
        attestationId
      ).run();

      return jsonResponse({ success: true, message: "Atestado atualizado com sucesso." });
    }

    // ── DELETE — Excluir atestado ─────────────────────────────────────────
    if (request.method === "DELETE") {
      const existing = await env.DB.prepare(
        "SELECT id, user_id FROM attestations WHERE id = ? LIMIT 1"
      ).bind(attestationId).first<any>();

      if (!existing) {
        return jsonResponse({ success: false, error: "Atestado não encontrado." }, 404);
      }
      if (existing.user_id !== user.id && user.role !== "admin") {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }

      await env.DB.prepare("DELETE FROM attestations WHERE id = ?").bind(attestationId).run();
      return jsonResponse({ success: true, message: "Atestado excluído com sucesso." });
    }

    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
  } catch (error) {
    console.error("[attestations/id] Erro:", error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno.",
    }, 500);
  }
}
