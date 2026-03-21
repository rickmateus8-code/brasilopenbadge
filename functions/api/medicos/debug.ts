interface Env { DB: D1Database; }
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const cnt = await env.DB.prepare("SELECT COUNT(*) as total FROM medicos_brasil").first();
    const sample = await env.DB.prepare("SELECT nome_medico, local_trabalho, uf_local FROM medicos_brasil LIMIT 5").all();
    const drConsulta = await env.DB.prepare("SELECT COUNT(*) as total FROM medicos_brasil WHERE UPPER(local_trabalho) LIKE '%DR%CONSULTA%'").first();
    return new Response(JSON.stringify({ total: cnt, drConsulta, sample: sample.results }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
