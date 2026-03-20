import type { Env } from "@/types/env";
import { requireAdmin } from "@/lib/auth";

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const admin = await requireAdmin(ctx);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = ctx.params as { id: string };
  const userId = parseInt(id);

  if (!userId || isNaN(userId)) {
    return new Response(JSON.stringify({ success: false, error: "Invalid user ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = ctx.env.DB;

    // Get attestations
    const attestations = await db.prepare(
      `SELECT id, 'atestado' as type, paciente as nome, created_at, status, codigo_qr
       FROM attestations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // Get other documents
    const documents = await db.prepare(
      `SELECT id, document_type as type, nome, created_at, status
       FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // Combine and sort
    const history = [
      ...(attestations.results || []),
      ...(documents.results || []),
    ].sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }).slice(0, 30);

    return new Response(JSON.stringify({ success: true, history }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
