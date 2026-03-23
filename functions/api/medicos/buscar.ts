// /api/medicos/buscar — Busca principal de médicos
// FILTRO OBRIGATÓRIO: somente médicos que trabalham em locais contendo "DR. CONSULTA" ou "DR CONSULTA"
interface Env { DB: D1Database; }

const FIELDS = "nome_medico,crm,uf_crm,especialidade,local_trabalho,cidade,uf_local,endereco,bairro";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

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
    const esp     = url.searchParams.get("especialidade") || url.searchParams.get("esp");
    const rawQ    = (url.searchParams.get("nome") || url.searchParams.get("q") || url.searchParams.get("termo") || "").trim();
    const termo   = rawQ.toUpperCase().replace(/[.\-]/g, "");
    const limit   = Math.min(parseInt(url.searchParams.get("limit") || "100"), 200);

    if (!uf) return new Response(JSON.stringify({ medicos: [] }), { headers: corsHeaders });

    // Usar D1 diretamente (dados já populados)
    let sql = `SELECT ${FIELDS} FROM medicos_brasil WHERE uf_local = ?`;
    const binds: any[] = [uf];

    // FILTRO DR. CONSULTA: somente médicos desse local
    sql += ` AND (UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')`;

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
    sql += ` ORDER BY nome_medico ASC LIMIT ?`; binds.push(limit);

    const r = await env.DB.prepare(sql).bind(...binds).all();
    return new Response(JSON.stringify({ medicos: r.results }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Erro em /api/medicos/buscar:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
};
