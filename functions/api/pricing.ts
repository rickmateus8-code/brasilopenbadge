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
  // Otimização de segurança: Busca em um único JOIN e garante que o usuário esteja ATIVO
  return env.DB.prepare(`
    SELECT u.id, u.username, u.role, u.balance
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    LIMIT 1
  `).bind(token).first<any>();
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
      // O banco já armazena em CENTAVOS (INTEGER)
      const priceInCents = Math.round(row.price); 
      priceMap[row.document_type] = {
        display_name: row.display_name,
        price: priceInCents,
        price_formatted: `R$ ${(priceInCents / 100).toFixed(2).replace('.', ',')}`,
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
