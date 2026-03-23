// /api/medicos/locais — Lista locais de trabalho (UPA, UBS, Dr. Consulta, Hospitais, etc.) de uma UF + cidade
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
    const tipo = url.searchParams.get("tipo")?.toUpperCase(); // "upa", "ubs", "hospital", "drconsulta", etc.
    if (!uf || !cidade) return new Response(JSON.stringify({ locais: [] }), { headers: corsHeaders });

    let filterSQL = "";
    if (tipo === "UPA") {
      filterSQL = `AND (UPPER(local_trabalho) LIKE '%UPA %' OR UPPER(local_trabalho) LIKE '%UPA-%' OR UPPER(local_trabalho) LIKE '%UNIDADE DE PRONTO ATENDIMENTO%')`;
    } else if (tipo === "UBS") {
      filterSQL = `AND (UPPER(local_trabalho) LIKE '%UBS %' OR UPPER(local_trabalho) LIKE '%UNIDADE BASICA%' OR UPPER(local_trabalho) LIKE '%UNIDADE BÁSICA%')`;
    } else if (tipo === "HOSPITAL") {
      filterSQL = `AND (UPPER(local_trabalho) LIKE '%HOSPITAL%' OR UPPER(local_trabalho) LIKE '%PRONTO SOCORRO%')`;
    } else if (tipo === "DRCONSULTA") {
      filterSQL = `AND (UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')`;
    } else {
      // Sem filtro de tipo: retorna todos os locais relevantes
      filterSQL = `AND (
        UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%'
        OR UPPER(local_trabalho) LIKE '%UPA %' OR UPPER(local_trabalho) LIKE '%UPA-%'
        OR UPPER(local_trabalho) LIKE '%UNIDADE DE PRONTO ATENDIMENTO%'
        OR UPPER(local_trabalho) LIKE '%UBS %' OR UPPER(local_trabalho) LIKE '%UNIDADE BASICA%'
        OR UPPER(local_trabalho) LIKE '%HOSPITAL%' OR UPPER(local_trabalho) LIKE '%PRONTO SOCORRO%'
        OR UPPER(local_trabalho) LIKE '%CLINICA%' OR UPPER(local_trabalho) LIKE '%CLÍNICA%'
        OR UPPER(local_trabalho) LIKE '%CONSULTORIO%' OR UPPER(local_trabalho) LIKE '%CONSULTÓRIO%'
        OR UPPER(local_trabalho) LIKE '%AMBULATORIO%' OR UPPER(local_trabalho) LIKE '%AMBULATÓRIO%'
        OR UPPER(local_trabalho) LIKE '%CENTRO DE SAUDE%' OR UPPER(local_trabalho) LIKE '%CENTRO DE SAÚDE%'
        OR UPPER(local_trabalho) LIKE '%POSTO DE SAUDE%' OR UPPER(local_trabalho) LIKE '%POSTO DE SAÚDE%'
        OR UPPER(local_trabalho) LIKE '%PREFEITURA%'
      )`;
    }

    const r = await env.DB.prepare(
      `SELECT DISTINCT local_trabalho FROM medicos_brasil 
       WHERE uf_local = ? AND UPPER(cidade) = UPPER(?)
       ${filterSQL}
       AND local_trabalho IS NOT NULL AND local_trabalho != ''
       ORDER BY local_trabalho ASC`
    ).bind(uf, cidade).all();

    return new Response(JSON.stringify({ locais: r.results.map((row: any) => row.local_trabalho) }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
