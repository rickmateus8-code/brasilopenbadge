// /api/medicos/buscar — Busca principal de médicos
// Filtra por locais conhecidos (Dr. Consulta, UPA, UBS, Hospitais, Clínicas, etc.)
interface Env { DB: D1Database; }

const FIELDS = "nome_medico,crm,uf_crm,especialidade,local_trabalho,cidade,uf_local,endereco,bairro";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Filtros de tipo de local
const LOCAL_FILTERS: Record<string, string> = {
  drconsulta: `(UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')`,
  upa: `(UPPER(local_trabalho) LIKE '%UPA %' OR UPPER(local_trabalho) LIKE '%UPA-%' OR UPPER(local_trabalho) LIKE '%UNIDADE DE PRONTO ATENDIMENTO%')`,
  ubs: `(UPPER(local_trabalho) LIKE '%UBS %' OR UPPER(local_trabalho) LIKE '%UNIDADE BASICA%' OR UPPER(local_trabalho) LIKE '%UNIDADE BÁSICA%')`,
  hospital: `(UPPER(local_trabalho) LIKE '%HOSPITAL%' OR UPPER(local_trabalho) LIKE '%PRONTO SOCORRO%')`,
  clinica: `(UPPER(local_trabalho) LIKE '%CLINICA%' OR UPPER(local_trabalho) LIKE '%CLÍNICA%' OR UPPER(local_trabalho) LIKE '%CONSULTORIO%' OR UPPER(local_trabalho) LIKE '%CONSULTÓRIO%')`,
};

const ALL_LOCALS_FILTER = `(
  UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%'
  OR UPPER(local_trabalho) LIKE '%UPA %' OR UPPER(local_trabalho) LIKE '%UPA-%' OR UPPER(local_trabalho) LIKE '%UNIDADE DE PRONTO ATENDIMENTO%'
  OR UPPER(local_trabalho) LIKE '%UBS %' OR UPPER(local_trabalho) LIKE '%UNIDADE BASICA%'
  OR UPPER(local_trabalho) LIKE '%HOSPITAL%' OR UPPER(local_trabalho) LIKE '%PRONTO SOCORRO%'
  OR UPPER(local_trabalho) LIKE '%CLINICA%' OR UPPER(local_trabalho) LIKE '%CLÍNICA%'
  OR UPPER(local_trabalho) LIKE '%CONSULTORIO%' OR UPPER(local_trabalho) LIKE '%CONSULTÓRIO%'
  OR UPPER(local_trabalho) LIKE '%AMBULATORIO%' OR UPPER(local_trabalho) LIKE '%AMBULATÓRIO%'
  OR UPPER(local_trabalho) LIKE '%CENTRO DE SAUDE%' OR UPPER(local_trabalho) LIKE '%CENTRO DE SAÚDE%'
  OR UPPER(local_trabalho) LIKE '%POSTO DE SAUDE%' OR UPPER(local_trabalho) LIKE '%POSTO DE SAÚDE%'
  OR UPPER(local_trabalho) LIKE '%PREFEITURA%'
)`;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const uf      = url.searchParams.get("uf")?.toUpperCase();
    const cidade  = url.searchParams.get("cidade");
    const bairro  = url.searchParams.get("bairro");
    const local   = url.searchParams.get("local");
    const tipoLocal = url.searchParams.get("tipo_local")?.toLowerCase(); // "upa", "ubs", "hospital", "drconsulta", "clinica"
    const esp     = url.searchParams.get("especialidade") || url.searchParams.get("esp");
    const rawQ    = (url.searchParams.get("nome") || url.searchParams.get("q") || url.searchParams.get("termo") || "").trim();
    const termo   = rawQ.toUpperCase().replace(/[.\-]/g, "");
    const limit   = Math.min(parseInt(url.searchParams.get("limit") || "100"), 200);

    if (!uf) return new Response(JSON.stringify({ medicos: [] }), { headers: corsHeaders });

    let sql = `SELECT ${FIELDS} FROM medicos_brasil WHERE uf_local = ?`;
    const binds: any[] = [uf];

    // Filtro de tipo de local
    if (tipoLocal && LOCAL_FILTERS[tipoLocal]) {
      sql += ` AND ${LOCAL_FILTERS[tipoLocal]}`;
    } else if (!local) {
      // Sem tipo específico e sem local exato: usar filtro amplo
      sql += ` AND ${ALL_LOCALS_FILTER}`;
    }

    if (cidade) { sql += ` AND UPPER(cidade) = UPPER(?)`; binds.push(cidade); }
    if (bairro) { sql += ` AND UPPER(bairro) = UPPER(?)`; binds.push(bairro); }
    if (local)  { sql += ` AND local_trabalho = ?`; binds.push(local); }

    if (termo.length >= 2) {
      const isCRM = /^\d+$/.test(termo);
      if (isCRM) {
        sql += ` AND crm LIKE ?`; binds.push(`%${termo}%`);
      } else {
        sql += ` AND (UPPER(nome_medico) LIKE UPPER(?) OR crm LIKE ?)`; binds.push(`%${termo}%`, `%${termo}%`);
      }
    }

    if (esp) { sql += ` AND UPPER(especialidade) LIKE UPPER(?)`; binds.push(`%${esp}%`); }
    // Priorizar UPA no topo, depois UBS, Hospital, Clínica, outros
    sql += ` ORDER BY
      CASE
        WHEN UPPER(local_trabalho) LIKE '%UPA %' OR UPPER(local_trabalho) LIKE '%UPA-%' OR UPPER(local_trabalho) LIKE '%UNIDADE DE PRONTO ATENDIMENTO%' THEN 1
        WHEN UPPER(local_trabalho) LIKE '%UBS %' OR UPPER(local_trabalho) LIKE '%UNIDADE BASICA%' OR UPPER(local_trabalho) LIKE '%UNIDADE BÁSICA%' THEN 2
        WHEN UPPER(local_trabalho) LIKE '%HOSPITAL%' OR UPPER(local_trabalho) LIKE '%PRONTO SOCORRO%' THEN 3
        WHEN UPPER(local_trabalho) LIKE '%CLINICA%' OR UPPER(local_trabalho) LIKE '%CLÍNICA%' THEN 4
        ELSE 5
      END ASC,
      nome_medico ASC LIMIT ?`; binds.push(limit);

    const r = await env.DB.prepare(sql).bind(...binds).all();
    return new Response(JSON.stringify({ medicos: r.results }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Erro em /api/medicos/buscar:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
};
