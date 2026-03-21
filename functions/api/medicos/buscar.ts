// /api/medicos/buscar — Busca principal de médicos
// FILTRO OBRIGATÓRIO: somente médicos que trabalham em locais contendo "DR. CONSULTA" ou "DR CONSULTA"
interface Env { DB: D1Database; }

const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";
const FIELDS = "nome_medico,crm,uf_crm,especialidade,local_trabalho,cidade,uf_local,endereco,bairro";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

async function sbGet(path: string): Promise<any[]> {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

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
    const limit   = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    if (!uf) return new Response(JSON.stringify({ medicos: [] }), { headers: corsHeaders });

    // Verificar se D1 tem dados suficientes
    let useD1 = false;
    try {
      const cnt = await env.DB.prepare("SELECT COUNT(*) as total FROM medicos_brasil").first<{ total: number }>();
      useD1 = (cnt?.total ?? 0) > 100000;
    } catch { useD1 = false; }

    if (useD1) {
      let sql = `SELECT ${FIELDS} FROM medicos_brasil WHERE uf_local = ?`;
      const binds: any[] = [uf];

      // FILTRO DR. CONSULTA: somente médicos desse local
      sql += ` AND (UPPER(local_trabalho) LIKE '%DR. CONSULTA%' OR UPPER(local_trabalho) LIKE '%DR CONSULTA%' OR UPPER(local_trabalho) LIKE '%DRCONSULTA%')`;

      if (cidade) { sql += ` AND cidade = ?`; binds.push(cidade); }
      if (bairro) { sql += ` AND bairro = ?`; binds.push(bairro); }
      if (local)  { sql += ` AND local_trabalho = ?`; binds.push(local); }

      if (termo.length >= 3) {
        const isCRM = /^\d+$/.test(termo);
        if (isCRM) {
          sql += ` AND crm LIKE ?`; binds.push(`%${termo}%`);
        } else {
          sql += ` AND (nome_medico LIKE ? OR crm LIKE ?)`; binds.push(`%${termo}%`, `%${termo}%`);
        }
      } else if (!cidade) {
        // Sem termo e sem cidade → retorna vazio
        return new Response(JSON.stringify({ medicos: [] }), { headers: corsHeaders });
      }

      if (esp) { sql += ` AND especialidade LIKE ?`; binds.push(`%${esp}%`); }
      sql += ` ORDER BY nome_medico ASC LIMIT ?`; binds.push(limit);

      const r = await env.DB.prepare(sql).bind(...binds).all();
      return new Response(JSON.stringify({ medicos: r.results }), { headers: corsHeaders });
    }

    // ─── Supabase ───────────────────────────────────────────────────────────
    let sbPath = `medicos_brasil?select=${FIELDS}&limit=${limit}&uf_local=eq.${uf}`;

    // FILTRO DR. CONSULTA
    sbPath += `&local_trabalho=ilike.*dr%20consulta*`;

    if (cidade) sbPath += `&cidade=eq.${encodeURIComponent(cidade)}`;
    if (bairro) sbPath += `&bairro=eq.${encodeURIComponent(bairro)}`;
    if (local)  sbPath += `&local_trabalho=eq.${encodeURIComponent(local)}`;

    if (termo.length >= 3) {
      const isCRM = /^\d+$/.test(termo);
      if (isCRM) {
        sbPath += `&crm=ilike.*${encodeURIComponent(termo)}*`;
      } else {
        sbPath += `&or=(nome_medico.ilike.*${encodeURIComponent(termo)}*,crm.ilike.*${encodeURIComponent(termo)}*)`;
      }
    } else if (!cidade) {
      return new Response(JSON.stringify({ medicos: [] }), { headers: corsHeaders });
    }

    if (esp) {
      if (esp === "CLINICO GERAL" || esp === "CLINICA") {
        sbPath += `&or=(especialidade.ilike.*CLINICA*,especialidade.ilike.*CLINICO*,especialidade.ilike.*GERAL*)`;
      } else {
        sbPath += `&especialidade=ilike.*${encodeURIComponent(esp)}*`;
      }
    }

    sbPath += `&order=nome_medico.asc`;

    const medicos = await sbGet(sbPath);
    return new Response(JSON.stringify({ medicos }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Erro em /api/medicos/buscar:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
};
