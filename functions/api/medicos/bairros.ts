// /api/medicos/bairros — Lista bairros de uma UF + cidade (somente Dr. Consulta)
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
    if (!uf || !cidade) return new Response(JSON.stringify({ bairros: [] }), { headers: corsHeaders });

    const r = await env.DB.prepare(
      `SELECT DISTINCT bairro FROM medicos_brasil 
       WHERE uf_local = ? AND UPPER(cidade) = UPPER(?)
       AND (UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')
       AND bairro IS NOT NULL AND bairro != ''
       ORDER BY bairro ASC`
    ).bind(uf, cidade).all();

    return new Response(JSON.stringify({ bairros: r.results.map((row: any) => row.bairro) }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
