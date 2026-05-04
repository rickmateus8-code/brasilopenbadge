import { Context } from "../types";

export async function onRequestGet(context: Context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  try {
    if (slug) {
      const template = await env.DB.prepare(
        "SELECT * FROM document_templates WHERE slug = ? AND is_active = 1"
      ).bind(slug).first();

      if (!template) {
        return new Response(JSON.stringify({ error: "Template não encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse JSON fields
      return new Response(JSON.stringify({
        success: true,
        data: {
          ...template,
          base_config: JSON.parse(template.base_config as string),
          fields_definition: JSON.parse(template.fields_definition as string),
          layout_definition: JSON.parse(template.layout_definition as string)
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const templates = await env.DB.prepare(
      "SELECT slug, name, category, price FROM document_templates WHERE is_active = 1"
    ).all();

    return new Response(JSON.stringify({
      success: true,
      data: templates.results
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
