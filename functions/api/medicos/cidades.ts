// /api/medicos/cidades — Lista cidades de uma UF (uf_local)
interface Env { DB: D1Database; }

const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";

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
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

async function sbRpc(fn: string, body: object): Promise<any[]> {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Supabase RPC ${fn} ${r.status}`);
  return r.json();
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const uf = url.searchParams.get("uf")?.toUpperCase();
    if (!uf) return new Response(JSON.stringify({ cidades: [] }), { headers: corsHeaders });

    // Verificar se D1 tem dados
    let useD1 = false;
    try {
      const cnt = await env.DB.prepare("SELECT COUNT(*) as total FROM medicos_brasil").first<{ total: number }>();
      useD1 = (cnt?.total ?? 0) > 100000;
    } catch { useD1 = false; }

    if (useD1) {
      const r = await env.DB.prepare(
        "SELECT DISTINCT cidade FROM medicos_brasil WHERE uf_local=? AND cidade IS NOT NULL ORDER BY cidade ASC LIMIT 500"
      ).bind(uf).all();
      return new Response(JSON.stringify({ cidades: r.results.map((x: any) => x.cidade) }), { headers: corsHeaders });
    }

    // Tentar RPC
    try {
      const data = await sbRpc("get_cidades", { uf_param: uf });
      const cidades = data.map((r: any) => r.nome_cidade || r.cidade).filter(Boolean).sort();
      return new Response(JSON.stringify({ cidades }), { headers: corsHeaders });
    } catch {}

    // Fallback: query direta
    const data = await sbGet(`medicos_brasil?select=cidade&uf_local=eq.${uf}&cidade=not.is.null&order=cidade.asc&limit=500`);
    const cidades = [...new Set(data.map((r: any) => r.cidade))].filter(Boolean).sort();
    return new Response(JSON.stringify({ cidades }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
