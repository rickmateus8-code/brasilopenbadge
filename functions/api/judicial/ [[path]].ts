import type { Env } from "../../types";

/**
 * judicial/[[path]].ts — Router para Consulta de Processos Judiciais
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

async function getAuthUser(request: Request, env: Env): Promise<any | null> {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/docmaster_session=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  return env.DB.prepare(
    "SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  ).bind(token).first();
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const user = await getAuthUser(request, env);

  // 1. alvara/save
  if (path === "alvara/save" && request.method === "POST") {
    const body = await request.json() as any;
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO alvaras (id, user_id, process_id, credor_nome, credor_cpf, advogado_nome, parte_contraria, valor, data_emissao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, user?.id || "anonymous", body.process_id, body.credor_nome, body.credor_cpf, body.advogado_nome, body.parte_contraria, body.valor, body.data_emissao).run();
    
    return new Response(JSON.stringify({ success: true, id }), { headers: CORS_HEADERS });
  }

  // 2. alvara/list
  if (path === "alvara/list") {
    const list = await env.DB.prepare("SELECT * FROM alvaras WHERE user_id = ? ORDER BY created_at DESC")
      .bind(user?.id || "anonymous").all();
    return new Response(JSON.stringify({ success: true, data: list.results }), { headers: CORS_HEADERS });
  }

  // 3. llm/suggest
  if (path === "llm/suggest" && request.method === "POST") {
    return new Response(JSON.stringify({
      success: true,
      suggestions: {
        valor: "26.516,28",
        advogado: "KEVIN PEREIRA BARCELOS",
        credor: "LAZARA MARGARIDA DE OLIVEIRA"
      }
    }), { headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Judicial API: Path not found" }), { status: 404, headers: CORS_HEADERS });
};
