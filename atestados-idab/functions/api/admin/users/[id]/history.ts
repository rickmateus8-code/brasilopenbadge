import type { Env } from '../../../../types';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthAdmin(request: Request, env: Env) {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
  if (!session) return null;
  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
  return user?.role === 'admin' ? user : null;
}

function parseData(value: any) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = String(params.id || '');
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid user ID' }), { status: 400, headers: corsHeaders });
    }

    const attestations = await env.DB.prepare(`
      SELECT id, 'atestado' AS type, paciente AS nome, status, codigo_qr, created_at, data_emissao
      FROM attestations WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).bind(userId).all<any>();

    const receitas = await env.DB.prepare(`
      SELECT id, 'receita' AS type, paciente AS nome, status, codigo_qr, created_at, data_emissao
      FROM receitas WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).bind(userId).all<any>();

    const documents = await env.DB.prepare(`
      SELECT id, type, data, status, codigo_qr, created_at
      FROM documents WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 40
    `).bind(userId).all<any>();

    const transactions = await env.DB.prepare(`
      SELECT id, type, amount, description, created_at, document_type, document_id
      FROM transactions WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 30
    `).bind(userId).all<any>();

    const referralsAsReferrer = await env.DB.prepare(`
      SELECT r.id, r.status, r.created_at, u.username AS referred_username,
             COALESCE((SELECT SUM(earned_amount) FROM referral_earnings re WHERE re.referrer_id = r.referrer_id AND re.referred_id = r.referred_id), 0) AS total_earned
      FROM referrals r
      JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `).bind(userId).all<any>();

    const referralsAsReferred = await env.DB.prepare(`
      SELECT r.id, r.status, r.created_at, u.username AS referrer_username
      FROM referrals r
      JOIN users u ON u.id = r.referrer_id
      WHERE r.referred_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `).bind(userId).all<any>();

    const documentHistory = [
      ...(attestations.results || []),
      ...(receitas.results || []),
      ...((documents.results || []).map((row: any) => {
        const data = parseData(row.data);
        return {
          id: row.id,
          type: row.type,
          nome: data.nome || data.nomeCompleto || data.paciente || '—',
          status: row.status,
          codigo_qr: row.codigo_qr,
          created_at: row.created_at,
          data_emissao: data.dataEmissao || data.data_emissao || data.emissao || data.data_expedicao_historico || row.created_at,
        };
      })),
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);

    return new Response(JSON.stringify({
      success: true,
      history: documentHistory,
      details: {
        documents: documentHistory,
        transactions: transactions.results || [],
        referrals: {
          as_referrer: referralsAsReferrer.results || [],
          as_referred: referralsAsReferred.results || [],
        },
        summary: {
          total_documents: documentHistory.length,
          total_transactions: (transactions.results || []).length,
          total_referrals: (referralsAsReferrer.results || []).length,
        },
      },
    }), { headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
