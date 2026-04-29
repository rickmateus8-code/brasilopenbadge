/**
 * /api/pricing — Endpoint público de consulta de preços
 *
 * Retorna os preços dos documentos para exibição no pop-up de confirmação.
 * Requer autenticação (sessão válida) mas não requer role admin.
 */
import type { Env } from '../types';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthUser(env: Env, token: string | null): Promise<any | null> {
  if (!token) return null;
  const now = new Date().toISOString();
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1"
  ).bind(token, now).first<{ user_id: string }>();
  if (!session) return null;
  const user = await env.DB.prepare(
    "SELECT id, username, role, balance, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1"
  ).bind(session.user_id).first<any>();
  return user || null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const token = getSessionToken(request);
    const user = await getAuthUser(env, token);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Buscar todos os preços ativos com overrides específicos do usuário
    const pricing = await env.DB.prepare(
      `SELECT 
        dp.document_type, 
        dp.display_name, 
        COALESCE(udo.price_override, dp.price) as price,
        COALESCE(udo.is_visible, 1) as is_visible
       FROM document_pricing dp
       LEFT JOIN user_document_overrides udo ON dp.document_type = udo.document_type AND udo.user_id = ?
       WHERE dp.is_active = 1 AND COALESCE(udo.is_visible, 1) = 1
       ORDER BY dp.display_name`
    ).bind(user.id).all<{ document_type: string; display_name: string; price: number }>();

    // Montar mapa de preços
    const priceMap: Record<string, { display_name: string; price: number; price_formatted: string }> = {};
    for (const row of pricing.results || []) {
      const priceInCents = Math.round(row.price * 100); // Garantir conversão para centavos
      priceMap[row.document_type] = {
        display_name: row.display_name,
        price: priceInCents,
        price_formatted: `R$ ${row.price.toFixed(2)}`,
      };
    }

    return new Response(JSON.stringify({
      success: true,
      pricing: priceMap,
      user_balance: user.balance,
      user_balance_formatted: `R$ ${(user.balance / 100).toFixed(2)}`,
      is_admin: user.role === "admin",
    }), { headers: corsHeaders });
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
