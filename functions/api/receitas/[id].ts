/**
 * /api/receitas/[id] — Proxy para o handler principal de receitas
 * Cloudflare Pages Functions requer arquivos separados para subpaths
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
  const receitaId = params.id;

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
      let receita;
      if (user.role === "admin") {
        receita = await env.DB.prepare("SELECT * FROM receitas WHERE id = ? LIMIT 1").bind(receitaId).first<any>();
      } else {
        receita = await env.DB.prepare("SELECT * FROM receitas WHERE id = ? AND user_id = ? LIMIT 1").bind(receitaId, user.id).first<any>();
      }
      if (!receita) return jsonResponse({ success: false, error: "Receita não encontrada." }, 404);
      return jsonResponse({ success: true, data: receita });
    }

    if (request.method === "PUT") {
      const receita = await env.DB.prepare("SELECT * FROM receitas WHERE id = ? LIMIT 1").bind(receitaId).first<any>();
      if (!receita) return jsonResponse({ success: false, error: "Receita não encontrada." }, 404);
      if (user.role !== "admin" && receita.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }

      const body = await request.json<any>();
      const now = new Date().toISOString();

      // CPF BLOQUEADO — não pode ser alterado após emissão
      let prescricao = body.prescricao;
      if (typeof prescricao === "object") prescricao = JSON.stringify(prescricao);

      await env.DB.prepare(`
        UPDATE receitas SET
          tipo_receituario = COALESCE(?, tipo_receituario),
          paciente = COALESCE(?, paciente),
          identidade = COALESCE(?, identidade),
          endereco = COALESCE(?, endereco),
          telefone = COALESCE(?, telefone),
          cidade = COALESCE(?, cidade),
          medico = COALESCE(?, medico),
          crm = COALESCE(?, crm),
          especialidade = COALESCE(?, especialidade),
          instituicao = COALESCE(?, instituicao),
          endereco_emitente = COALESCE(?, endereco_emitente),
          cnpj_emitente = COALESCE(?, cnpj_emitente),
          telefone_emitente = COALESCE(?, telefone_emitente),
          site_emitente = COALESCE(?, site_emitente),
          prescricao = COALESCE(?, prescricao),
          data_emissao = COALESCE(?, data_emissao),
          hora_emissao = COALESCE(?, hora_emissao),
          logo_url = COALESCE(?, logo_url),
          signature_color = COALESCE(?, signature_color),
          signature_image = COALESCE(?, signature_image),
          updated_at = ?
        WHERE id = ?
      `).bind(
        body.tipo_receituario || null,
        body.paciente || null,
        body.identidade || null,
        body.endereco || null,
        body.telefone || null,
        body.cidade || null,
        body.medico || null,
        body.crm || null,
        body.especialidade || null,
        body.instituicao || null,
        body.endereco_emitente || null,
        body.cnpj_emitente || null,
        body.telefone_emitente || null,
        body.site_emitente || null,
        prescricao || null,
        body.data_emissao || null,
        body.hora_emissao || null,
        body.logo_url || null,
        body.signature_color || null,
        body.signature_image || null,
        now,
        receitaId
      ).run();

      return jsonResponse({ success: true, message: "Receita atualizada com sucesso." });
    }

    if (request.method === "DELETE") {
      const receita = await env.DB.prepare("SELECT id, user_id FROM receitas WHERE id = ? LIMIT 1").bind(receitaId).first<any>();
      if (!receita) return jsonResponse({ success: false, error: "Receita não encontrada." }, 404);
      if (user.role !== "admin" && receita.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }
      await env.DB.prepare("UPDATE receitas SET status = 'cancelado', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), receitaId).run();
      return jsonResponse({ success: true, message: "Receita cancelada com sucesso." });
    }

    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
  } catch (error) {
    console.error("[receitas/[id]] Erro:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Erro interno." }, 500);
  }
}
