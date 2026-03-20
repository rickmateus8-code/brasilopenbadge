// /api/medicos — Busca de médicos via Supabase (backend seguro) com fallback para D1
// As chaves do Supabase ficam seguras no Worker, nunca expostas no frontend

interface Env {
  DB: D1Database;
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
}

const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";

const FIELDS_SB = "nome_medico,crm,uf_crm,especialidade,local_trabalho,cidade,uf_local,endereco,bairro";
const FIELDS_D1 = "nome_medico, crm, uf_crm, especialidade, local_trabalho, cidade, uf_local, endereco, bairro";

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

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
      status: 405, headers: corsHeaders,
    });
  }

  try {
    const action = url.searchParams.get("action") || "search";
    const uf = url.searchParams.get("uf")?.toUpperCase();
    const termo = url.searchParams.get("q")?.trim();
    const tipo = url.searchParams.get("tipo") || "nome";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    // ─── Verificar se D1 já tem dados suficientes ───────────────────────────
    let useD1 = false;
    try {
      const countResult = await env.DB.prepare(
        "SELECT COUNT(*) as total FROM medicos_brasil"
      ).first<{ total: number }>();
      useD1 = (countResult?.total ?? 0) > 100000; // usa D1 se tiver mais de 100k médicos
    } catch {
      useD1 = false;
    }

    // ─── Buscar cidades por UF ──────────────────────────────────────────────
    if (action === "cidades") {
      if (!uf) {
        return new Response(JSON.stringify({ error: "UF obrigatória" }), {
          status: 400, headers: corsHeaders,
        });
      }

      if (useD1) {
        const result = await env.DB.prepare(
          "SELECT DISTINCT cidade FROM medicos_brasil WHERE uf_local = ? AND cidade IS NOT NULL ORDER BY cidade ASC LIMIT 200"
        ).bind(uf).all();
        const cidades = result.results.map((r: any) => r.cidade);
        return new Response(JSON.stringify(cidades), { headers: corsHeaders });
      }

      // Supabase
      const sbUrl = `${SB_URL}/rest/v1/medicos_brasil?select=cidade&uf_local=eq.${uf}&cidade=not.is.null&order=cidade.asc&limit=200`;
      const sbResp = await fetch(sbUrl, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Prefer": "return=representation" }
      });
      const data: any[] = await sbResp.json();
      const cidades = [...new Set(data.map((r: any) => r.cidade))].sort();
      return new Response(JSON.stringify(cidades), { headers: corsHeaders });
    }

    // ─── Buscar bairros por UF + cidade ────────────────────────────────────
    if (action === "bairros") {
      const cidade = url.searchParams.get("cidade");
      if (!uf || !cidade) {
        return new Response(JSON.stringify({ error: "UF e cidade obrigatórias" }), {
          status: 400, headers: corsHeaders,
        });
      }

      if (useD1) {
        const result = await env.DB.prepare(
          "SELECT DISTINCT bairro FROM medicos_brasil WHERE uf_local = ? AND cidade = ? AND bairro IS NOT NULL ORDER BY bairro ASC LIMIT 200"
        ).bind(uf, cidade).all();
        const bairros = result.results.map((r: any) => r.bairro);
        return new Response(JSON.stringify(bairros), { headers: corsHeaders });
      }

      const sbUrl = `${SB_URL}/rest/v1/medicos_brasil?select=bairro&uf_local=eq.${uf}&cidade=eq.${encodeURIComponent(cidade)}&bairro=not.is.null&order=bairro.asc&limit=200`;
      const sbResp = await fetch(sbUrl, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      const data: any[] = await sbResp.json();
      const bairros = [...new Set(data.map((r: any) => r.bairro))].sort();
      return new Response(JSON.stringify(bairros), { headers: corsHeaders });
    }

    // ─── Buscar locais de trabalho por UF + cidade ─────────────────────────
    if (action === "locais") {
      const cidade = url.searchParams.get("cidade");
      if (!uf || !cidade) {
        return new Response(JSON.stringify({ error: "UF e cidade obrigatórias" }), {
          status: 400, headers: corsHeaders,
        });
      }

      if (useD1) {
        const result = await env.DB.prepare(
          "SELECT DISTINCT local_trabalho FROM medicos_brasil WHERE uf_local = ? AND cidade = ? AND local_trabalho IS NOT NULL ORDER BY local_trabalho ASC LIMIT 200"
        ).bind(uf, cidade).all();
        const locais = result.results.map((r: any) => r.local_trabalho);
        return new Response(JSON.stringify(locais), { headers: corsHeaders });
      }

      const sbUrl = `${SB_URL}/rest/v1/medicos_brasil?select=local_trabalho&uf_local=eq.${uf}&cidade=eq.${encodeURIComponent(cidade)}&local_trabalho=not.is.null&order=local_trabalho.asc&limit=200`;
      const sbResp = await fetch(sbUrl, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      const data: any[] = await sbResp.json();
      const locais = [...new Set(data.map((r: any) => r.local_trabalho))].sort();
      return new Response(JSON.stringify(locais), { headers: corsHeaders });
    }

    // ─── Busca principal de médicos ─────────────────────────────────────────
    if (!termo && !uf) {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }

    if (useD1) {
      // Usar D1 quando já tiver dados suficientes
      let stmt: D1PreparedStatement;
      if (termo && uf) {
        if (tipo === "crm") {
          stmt = env.DB.prepare(
            `SELECT ${FIELDS_D1} FROM medicos_brasil WHERE uf_crm = ? AND crm LIKE ? LIMIT ?`
          ).bind(uf, `%${termo}%`, limit);
        } else {
          stmt = env.DB.prepare(
            `SELECT ${FIELDS_D1} FROM medicos_brasil WHERE uf_crm = ? AND nome_medico LIKE ? LIMIT ?`
          ).bind(uf, `%${termo}%`, limit);
        }
      } else if (uf) {
        stmt = env.DB.prepare(
          `SELECT ${FIELDS_D1} FROM medicos_brasil WHERE uf_local = ? LIMIT ?`
        ).bind(uf, limit);
      } else {
        stmt = env.DB.prepare(
          `SELECT ${FIELDS_D1} FROM medicos_brasil WHERE nome_medico LIKE ? LIMIT ?`
        ).bind(`%${termo}%`, limit);
      }
      const result = await stmt.all();
      return new Response(JSON.stringify(result.results), { headers: corsHeaders });
    }

    // ─── Usar Supabase via backend (seguro) ────────────────────────────────
    let sbUrl = `${SB_URL}/rest/v1/medicos_brasil?select=${FIELDS_SB}&limit=${limit}`;

    if (termo && uf) {
      if (tipo === "crm") {
        sbUrl += `&uf_crm=eq.${uf}&crm=ilike.*${encodeURIComponent(termo)}*`;
      } else {
        sbUrl += `&uf_crm=eq.${uf}&nome_medico=ilike.*${encodeURIComponent(termo)}*`;
      }
    } else if (uf) {
      sbUrl += `&uf_crm=eq.${uf}`;
    } else if (termo) {
      sbUrl += `&nome_medico=ilike.*${encodeURIComponent(termo)}*`;
    }

    const sbResp = await fetch(sbUrl, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!sbResp.ok) {
      throw new Error(`Supabase error: ${sbResp.status}`);
    }

    const medicos = await sbResp.json();
    return new Response(JSON.stringify(medicos), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Erro em /api/medicos:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor", details: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
};
