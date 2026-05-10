import type { Env } from "../../../types";

const getCorsHeaders = (request: Request) => ({
  "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
});

function getSessionToken(request: Request): string | null {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.split(";").map(c => c.trim()).find(c => c.startsWith("docmaster_session="));
  return match ? match.split("=")[1] : null;
}

async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const token = getSessionToken(request);
  if (!token) return false;
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(token).first<any>();
  if (!session) return false;
  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(session.user_id).first<any>();
  return user?.role === "admin";
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const corsHeaders = getCorsHeaders(request);
  if (!(await isAdmin(request, env))) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 403, headers: corsHeaders });
  }

  const userId = params.id;
  const { permissions } = await request.json() as any;

  try {
    await env.DB.prepare(
      "UPDATE users SET permissions = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(JSON.stringify(permissions), userId).run();

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request) });
};
