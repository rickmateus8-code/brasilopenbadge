import type { Env } from '../../../types';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400, headers: corsHeaders });

  try {
    const history = await env.DB.prepare(
      "SELECT * FROM document_template_history WHERE template_slug = ? ORDER BY created_at DESC LIMIT 5"
    ).bind(slug).all();

    return new Response(JSON.stringify({ success: true, data: history.results }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
