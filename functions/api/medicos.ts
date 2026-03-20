// /api/medicos — Busca de médicos no banco D1 (sem dependência do Supabase)
// Substitui completamente a integração com Supabase no frontend

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const action = url.searchParams.get("action") || "search";

    // ─── Buscar cidades por UF ──────────────────────────────────────────────
    if (action === "cidades") {
      const uf = url.searchParams.get("uf")?.toUpperCase();
      if (!uf) {
        return new Response(JSON.stringify({ error: "UF obrigatória" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const result = await env.DB.prepare(
        "SELECT DISTINCT cidade FROM medicos_brasil WHERE uf_local = ? AND cidade IS NOT NULL ORDER BY cidade ASC LIMIT 200"
      ).bind(uf).all();
      const cidades = result.results.map((r: any) => r.cidade);
      return new Response(JSON.stringify(cidades), { headers: corsHeaders });
    }

    // ─── Buscar bairros por UF + cidade ────────────────────────────────────
    if (action === "bairros") {
      const uf = url.searchParams.get("uf")?.toUpperCase();
      const cidade = url.searchParams.get("cidade");
      if (!uf || !cidade) {
        return new Response(JSON.stringify({ error: "UF e cidade obrigatórias" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const result = await env.DB.prepare(
        "SELECT DISTINCT bairro FROM medicos_brasil WHERE uf_local = ? AND cidade = ? AND bairro IS NOT NULL ORDER BY bairro ASC LIMIT 200"
      ).bind(uf, cidade).all();
      const bairros = result.results.map((r: any) => r.bairro);
      return new Response(JSON.stringify(bairros), { headers: corsHeaders });
    }

    // ─── Buscar locais de trabalho por UF + cidade ─────────────────────────
    if (action === "locais") {
      const uf = url.searchParams.get("uf")?.toUpperCase();
      const cidade = url.searchParams.get("cidade");
      if (!uf || !cidade) {
        return new Response(JSON.stringify({ error: "UF e cidade obrigatórias" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const result = await env.DB.prepare(
        "SELECT DISTINCT local_trabalho FROM medicos_brasil WHERE uf_local = ? AND cidade = ? AND local_trabalho IS NOT NULL ORDER BY local_trabalho ASC LIMIT 200"
      ).bind(uf, cidade).all();
      const locais = result.results.map((r: any) => r.local_trabalho);
      return new Response(JSON.stringify(locais), { headers: corsHeaders });
    }

    // ─── Busca principal de médicos ─────────────────────────────────────────
    // action = "search" (padrão)
    const uf = url.searchParams.get("uf")?.toUpperCase();
    const termo = url.searchParams.get("q")?.trim();
    const tipo = url.searchParams.get("tipo") || "nome"; // "nome" | "crm"
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const FIELDS = "nome_medico, crm, uf_crm, especialidade, local_trabalho, cidade, uf_local, endereco, bairro";

    let stmt: D1PreparedStatement;

    if (termo && uf) {
      if (tipo === "crm") {
        stmt = env.DB.prepare(
          `SELECT ${FIELDS} FROM medicos_brasil WHERE uf_crm = ? AND crm LIKE ? LIMIT ?`
        ).bind(uf, `%${termo}%`, limit);
      } else {
        stmt = env.DB.prepare(
          `SELECT ${FIELDS} FROM medicos_brasil WHERE uf_crm = ? AND nome_medico LIKE ? LIMIT ?`
        ).bind(uf, `%${termo}%`, limit);
      }
    } else if (uf) {
      stmt = env.DB.prepare(
        `SELECT ${FIELDS} FROM medicos_brasil WHERE uf_local = ? LIMIT ?`
      ).bind(uf, limit);
    } else if (termo) {
      stmt = env.DB.prepare(
        `SELECT ${FIELDS} FROM medicos_brasil WHERE nome_medico LIKE ? LIMIT ?`
      ).bind(`%${termo}%`, limit);
    } else {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }

    const result = await stmt.all();
    return new Response(JSON.stringify(result.results), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Erro em /api/medicos:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: corsHeaders,
    });
  }
};
