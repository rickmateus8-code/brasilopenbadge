// /api/medicos — Busca de médicos via Supabase (backend seguro) com fallback para D1
// Lógica replicada do elitedoc.store: uf_local para filtros geográficos, busca por nome/CRM

interface Env {
  DB: D1Database;
}

const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";
const FIELDS = "nome_medico,crm,uf_crm,especialidade,local_trabalho,cidade,uf_local,endereco,bairro";

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const action  = url.searchParams.get("action") || "search";
    const uf      = url.searchParams.get("uf")?.toUpperCase();
    const cidade  = url.searchParams.get("cidade");
    const bairro  = url.searchParams.get("bairro");
    const esp     = url.searchParams.get("esp");
    const rawQ    = url.searchParams.get("q")?.trim() || "";
    const termo   = rawQ.toUpperCase().replace(/[.\-]/g, "");
    const limit   = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    // ─── Verificar se D1 já tem dados suficientes (>100k) ──────────────────
    let useD1 = false;
    try {
      const cnt = await env.DB.prepare("SELECT COUNT(*) as total FROM medicos_brasil").first<{ total: number }>();
      useD1 = (cnt?.total ?? 0) > 100000;
    } catch { useD1 = false; }

    // ─── Helper: fetch Supabase REST ────────────────────────────────────────
    async function sbGet(path: string): Promise<any[]> {
      const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
      return r.json();
    }

    // ─── Helper: RPC Supabase ───────────────────────────────────────────────
    async function sbRpc(fn: string, body: object): Promise<any[]> {
      const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Supabase RPC ${fn} ${r.status}`);
      return r.json();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: cidades — lista cidades de uma UF (uf_local)
    // ═══════════════════════════════════════════════════════════════════════
    if (action === "cidades") {
      if (!uf) return new Response(JSON.stringify([]), { headers: corsHeaders });

      if (useD1) {
        const r = await env.DB.prepare(
          "SELECT DISTINCT cidade FROM medicos_brasil WHERE uf_local=? AND cidade IS NOT NULL ORDER BY cidade ASC LIMIT 500"
        ).bind(uf).all();
        return new Response(JSON.stringify(r.results.map((x: any) => x.cidade)), { headers: corsHeaders });
      }

      // Tentar RPC get_cidades primeiro (igual ao elitedoc)
      try {
        const data = await sbRpc("get_cidades", { uf_param: uf });
        const cidades = data.map((r: any) => r.nome_cidade || r.cidade).filter(Boolean).sort();
        return new Response(JSON.stringify(cidades), { headers: corsHeaders });
      } catch {}

      // Fallback: query direta
      const data = await sbGet(`medicos_brasil?select=cidade&uf_local=eq.${uf}&cidade=not.is.null&order=cidade.asc&limit=500`);
      const cidades = [...new Set(data.map((r: any) => r.cidade))].filter(Boolean).sort();
      return new Response(JSON.stringify(cidades), { headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: bairros — lista bairros de uma UF + cidade
    // ═══════════════════════════════════════════════════════════════════════
    if (action === "bairros") {
      if (!uf || !cidade) return new Response(JSON.stringify([]), { headers: corsHeaders });

      if (useD1) {
        const r = await env.DB.prepare(
          "SELECT DISTINCT bairro FROM medicos_brasil WHERE uf_local=? AND cidade=? AND bairro IS NOT NULL ORDER BY bairro ASC LIMIT 200"
        ).bind(uf, cidade).all();
        return new Response(JSON.stringify(r.results.map((x: any) => x.bairro)), { headers: corsHeaders });
      }

      try {
        const data = await sbRpc("get_bairros", { cidade_param: cidade, uf_param: uf });
        const bairros = data.map((r: any) => r.nome_bairro || r.bairro).filter(Boolean).sort();
        return new Response(JSON.stringify(bairros), { headers: corsHeaders });
      } catch {}

      const data = await sbGet(`medicos_brasil?select=bairro&uf_local=eq.${uf}&cidade=eq.${encodeURIComponent(cidade)}&bairro=not.is.null&order=bairro.asc&limit=200`);
      const bairros = [...new Set(data.map((r: any) => r.bairro))].filter(Boolean).sort();
      return new Response(JSON.stringify(bairros), { headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: locais — lista locais de trabalho de uma UF + cidade
    // ═══════════════════════════════════════════════════════════════════════
    if (action === "locais") {
      if (!uf || !cidade) return new Response(JSON.stringify([]), { headers: corsHeaders });

      if (useD1) {
        const r = await env.DB.prepare(
          "SELECT DISTINCT local_trabalho FROM medicos_brasil WHERE uf_local=? AND cidade=? AND local_trabalho IS NOT NULL ORDER BY local_trabalho ASC LIMIT 200"
        ).bind(uf, cidade).all();
        return new Response(JSON.stringify(r.results.map((x: any) => x.local_trabalho)), { headers: corsHeaders });
      }

      const data = await sbGet(`medicos_brasil?select=local_trabalho&uf_local=eq.${uf}&cidade=eq.${encodeURIComponent(cidade)}&local_trabalho=not.is.null&order=local_trabalho.asc&limit=200`);
      const locais = [...new Set(data.map((r: any) => r.local_trabalho))].filter(Boolean).sort();
      return new Response(JSON.stringify(locais), { headers: corsHeaders });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: search — busca principal de médicos (igual ao elitedoc)
    // Regra:
    //   - termo >= 3 chars → busca por nome OU CRM, filtra por uf_local se UF fornecida
    //   - sem termo mas UF + cidade → lista médicos da cidade (com filtros opcionais)
    //   - sem nada → retorna vazio
    // ═══════════════════════════════════════════════════════════════════════
    if (!termo && !uf) return new Response(JSON.stringify([]), { headers: corsHeaders });
    if (!termo && uf && !cidade) return new Response(JSON.stringify([]), { headers: corsHeaders });

    if (useD1) {
      let sql = `SELECT ${FIELDS} FROM medicos_brasil WHERE `;
      const binds: any[] = [];

      if (termo.length >= 3) {
        const isCRM = /^\d+$/.test(termo);
        if (isCRM) {
          sql += `crm LIKE ?`; binds.push(`%${termo}%`);
        } else {
          sql += `(nome_medico LIKE ? OR crm LIKE ?)`; binds.push(`%${termo}%`, `%${termo}%`);
        }
        if (uf) { sql += ` AND uf_local = ?`; binds.push(uf); }
      } else if (uf && cidade) {
        sql += `uf_local = ? AND cidade = ?`; binds.push(uf, cidade);
        if (bairro) { sql += ` AND bairro = ?`; binds.push(bairro); }
      } else {
        return new Response(JSON.stringify([]), { headers: corsHeaders });
      }

      if (esp) { sql += ` AND especialidade LIKE ?`; binds.push(`%${esp}%`); }
      sql += ` LIMIT ?`; binds.push(limit);

      const r = await env.DB.prepare(sql).bind(...binds).all();
      return new Response(JSON.stringify(r.results), { headers: corsHeaders });
    }

    // ─── Supabase ───────────────────────────────────────────────────────────
    let sbPath = `medicos_brasil?select=${FIELDS}&limit=${limit}`;

    if (termo.length >= 3) {
      const isCRM = /^\d+$/.test(termo);
      if (isCRM) {
        sbPath += `&crm=ilike.*${encodeURIComponent(termo)}*`;
      } else {
        // busca por nome OU CRM (igual ao elitedoc: or=nome_medico.ilike...,crm.ilike...)
        sbPath += `&or=(nome_medico.ilike.*${encodeURIComponent(termo)}*,crm.ilike.*${encodeURIComponent(termo)}*)`;
      }
      if (uf) sbPath += `&uf_local=eq.${uf}`;
    } else if (uf && cidade) {
      sbPath += `&uf_local=eq.${uf}&cidade=eq.${encodeURIComponent(cidade)}`;
      if (bairro) sbPath += `&bairro=eq.${encodeURIComponent(bairro)}`;
    } else {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }

    // Filtro de especialidade
    if (esp === "CLINICA") {
      sbPath += `&or=(especialidade.ilike.*CLINICA*,especialidade.ilike.*CLINICO*,especialidade.ilike.*GERAL*)`;
    } else if (esp) {
      sbPath += `&especialidade=ilike.*${encodeURIComponent(esp)}*`;
    }

    const medicos = await sbGet(sbPath);
    return new Response(JSON.stringify(medicos), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Erro em /api/medicos:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
};
