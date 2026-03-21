// /api/medicos/especialidades — Lista especialidades Dr. Consulta
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
    const r = await env.DB.prepare(
      "SELECT nome FROM especialidades_drconsulta ORDER BY nome ASC"
    ).all();
    return new Response(JSON.stringify({ especialidades: r.results.map((row: any) => row.nome) }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
