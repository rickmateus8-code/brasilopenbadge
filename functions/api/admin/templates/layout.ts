import type { Env } from '../../../types';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { slug, layout_definition } = await request.json() as any;

    if (!slug || !layout_definition) {
      return new Response(JSON.stringify({ success: false, error: "Slug e layout são obrigatórios." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Atualizar o layout no banco D1
    await env.DB.prepare(
      "UPDATE document_templates SET layout_definition = ? WHERE slug = ?"
    ).bind(JSON.stringify(layout_definition), slug).run();

    return new Response(JSON.stringify({ success: true, message: "Layout atualizado com sucesso." }), {
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
