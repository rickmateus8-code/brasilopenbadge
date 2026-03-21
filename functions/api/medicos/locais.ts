// /api/medicos/locais — Lista locais de trabalho Dr. Consulta de uma UF + cidade
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
    if (!uf || !cidade) return new Response(JSON.stringify({ locais: [] }), { headers: corsHeaders });

    const r = await env.DB.prepare(
      `SELECT DISTINCT local_trabalho FROM medicos_brasil 
       WHERE uf_local = ? AND UPPER(cidade) = UPPER(?)
       AND (UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')
       AND local_trabalho IS NOT NULL AND local_trabalho != ''
       ORDER BY local_trabalho ASC`
    ).bind(uf, cidade).all();

    return new Response(JSON.stringify({ locais: r.results.map((row: any) => row.local_trabalho) }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
