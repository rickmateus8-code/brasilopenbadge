import type { Env } from "../types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const result = await env.DB.prepare("SELECT * FROM emission_models ORDER BY doc_name ASC").all();
    return new Response(JSON.stringify({ success: true, models: result.results || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
