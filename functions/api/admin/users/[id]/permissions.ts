import { Context } from "../../../types";

export async function onRequestPut(context: Context) {
  const { env, params, request } = context;
  const userId = params.id;
  const { permissions } = await request.json() as any;

  try {
    await env.DB.prepare(
      "UPDATE users SET permissions = ? WHERE id = ?"
    ).bind(JSON.stringify(permissions), userId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
