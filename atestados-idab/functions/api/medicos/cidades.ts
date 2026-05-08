// /api/medicos/cidades — Lista cidades de uma UF (somente Dr. Consulta)
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
    if (!uf) return new Response(JSON.stringify({ cidades: [] }), { headers: corsHeaders });

    const r = await env.DB.prepare(
      `SELECT DISTINCT cidade FROM medicos_brasil 
       WHERE uf_local = ? 
       AND (UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')
       AND cidade IS NOT NULL AND cidade != ''
       ORDER BY cidade ASC`
    ).bind(uf).all();

    return new Response(JSON.stringify({ cidades: r.results.map((row: any) => row.cidade) }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
