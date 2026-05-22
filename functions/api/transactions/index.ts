import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthUser(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  return env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    // Query combinada para trazer transações, ganhos de indicação e cashback
    const query = `
      SELECT 
        id, 
        'debit' as type, 
        amount, 
        description, 
        created_at
      FROM transactions 
      WHERE user_id = ? AND type = 'debit'
      
      UNION ALL
      
      SELECT 
        id, 
        'credit' as type, 
        amount, 
        description, 
        created_at
      FROM transactions 
      WHERE user_id = ? AND type = 'credit' AND (status = 'completed' OR status IS NULL)

      UNION ALL

      SELECT 
        id, 
        'credit' as type, 
        (earned_amount * 100) as amount, 
        'Comissão de Indicação' as description, 
        created_at
      FROM referral_earnings
      WHERE referrer_id = ?

      UNION ALL

      SELECT 
        id, 
        'credit' as type, 
        (cashback_amount * 100) as amount, 
        'Cashback Recebido' as description, 
        created_at
      FROM cashback_earnings
      WHERE user_id = ?

      ORDER BY created_at DESC 
      LIMIT 100
    `;

    const result = await env.DB.prepare(query)
      .bind(user.id, user.id, user.id, user.id)
      .all<any>();

    return new Response(JSON.stringify({
      success: true,
      transactions: (result.results || []).map(t => ({
        ...t,
        amount: Math.round(Number(t.amount)) // Garante que é inteiro (centavos)
      }))
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
