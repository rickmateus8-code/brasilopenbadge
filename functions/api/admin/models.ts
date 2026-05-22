import type { Env } from "../../types";

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const result = await env.DB.prepare("SELECT * FROM emission_models ORDER BY doc_name ASC").all();
    return new Response(JSON.stringify({ success: true, models: result.results || [] }), {
      headers: { "Content-Type": "application/json", ...getCorsHeaders(new Request("http://localhost")) },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const corsHeaders = getCorsHeaders(request);
    const body: any = await request.json();
    const { id, images } = body;

    if (!id) return new Response(JSON.stringify({ error: "ID é obrigatório" }), { status: 400 });

    const imagesJson = JSON.stringify(images || []);
    
    await env.DB.prepare("UPDATE emission_models SET images = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(imagesJson, id)
      .run();

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request) });
};
