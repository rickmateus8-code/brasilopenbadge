// /api/medicos/locais — Lista locais de trabalho de uma UF + cidade
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const uf = url.searchParams.get("uf")?.toUpperCase();
    const cidade = url.searchParams.get("cidade");
    if (!uf || !cidade) return new Response(JSON.stringify({ locais: [] }), { headers: corsHeaders });

    let useD1 = false;
    try {
      const cnt = await env.DB.prepare("SELECT COUNT(*) as total FROM medicos_brasil").first<{ total: number }>();
      useD1 = (cnt?.total ?? 0) > 100000;
    } catch { useD1 = false; }

    if (useD1) {
      const r = await env.DB.prepare(
        "SELECT DISTINCT local_trabalho FROM medicos_brasil WHERE uf_local=? AND cidade=? AND local_trabalho IS NOT NULL ORDER BY local_trabalho ASC LIMIT 200"
      ).bind(uf, cidade).all();
      return new Response(JSON.stringify({ locais: r.results.map((x: any) => x.local_trabalho) }), { headers: corsHeaders });
    }

    const data = await sbGet(`medicos_brasil?select=local_trabalho&uf_local=eq.${uf}&cidade=eq.${encodeURIComponent(cidade)}&local_trabalho=not.is.null&order=local_trabalho.asc&limit=200`);
    const locais = [...new Set(data.map((r: any) => r.local_trabalho))].filter(Boolean).sort();
    return new Response(JSON.stringify({ locais }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
