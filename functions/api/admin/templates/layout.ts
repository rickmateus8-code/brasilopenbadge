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

    // 1. Backup da versão atual para o histórico
    const current = await env.DB.prepare(
      "SELECT layout_definition FROM document_templates WHERE slug = ?"
    ).bind(slug).first() as any;

    if (current && current.layout_definition) {
      await env.DB.prepare(
        "INSERT INTO document_template_history (template_slug, layout_definition) VALUES (?, ?)"
      ).bind(slug, current.layout_definition).run();
    }

    // 2. Atualizar o layout no banco D1
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
