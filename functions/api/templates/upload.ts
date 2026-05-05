import { Context } from "../types";

export async function onRequestPost(context: Context) {
  const { env, request } = context;
  
  // Verificação de autenticação admin simplificada
  const auth = request.headers.get("Authorization");
  if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!file || !name || !slug) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Gravar no R2 seria o ideal, por enquanto estamos simulando salvando no sistema de arquivos da própria cloud worker ou persistindo metadados
    // Como estamos em ambiente serverless, vamos apenas criar o registro no DB com placeholder
    await env.DB.prepare(
      "INSERT INTO document_templates (slug, name, category, price) VALUES (?, ?, 'Universal', 5.00)"
    ).bind(slug, name).run();

    return new Response(JSON.stringify({ success: true, message: "Template base registrado" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
