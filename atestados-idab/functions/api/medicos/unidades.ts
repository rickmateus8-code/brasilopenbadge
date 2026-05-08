// /api/medicos/unidades — Lista unidades Dr. Consulta por UF e cidade
interface Env { DB: D1Database; }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const uf = url.searchParams.get("uf")?.toUpperCase();
    const cidade = url.searchParams.get("cidade");

    // Se nenhum filtro, retornar UFs disponíveis
    if (!uf) {
      const r = await env.DB.prepare(
        "SELECT DISTINCT uf FROM unidades_drconsulta ORDER BY uf ASC"
      ).all();
      return new Response(JSON.stringify({ ufs: r.results.map((row: any) => row.uf) }), { headers: corsHeaders });
    }

    // Se só UF, retornar cidades
    if (!cidade) {
      const r = await env.DB.prepare(
        "SELECT DISTINCT cidade FROM unidades_drconsulta WHERE uf = ? ORDER BY cidade ASC"
      ).bind(uf).all();
      return new Response(JSON.stringify({ cidades: r.results.map((row: any) => row.cidade) }), { headers: corsHeaders });
    }

    // Se UF + cidade, retornar unidades
    const r = await env.DB.prepare(
      "SELECT * FROM unidades_drconsulta WHERE uf = ? AND UPPER(cidade) = UPPER(?) ORDER BY nome ASC"
    ).bind(uf, cidade).all();
    return new Response(JSON.stringify({ unidades: r.results }), { headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
