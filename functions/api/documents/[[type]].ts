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
    'SELECT id, username, email, display_name, role, balance, is_active FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '.';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Document prices in cents
const DOCUMENT_PRICES: Record<string, number> = {
  'cnh': 500,
  'cha': 500,
  'toxicologico': 500,
  'historico-sp': 500,
  'historico-uninter': 500,
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    const typeParam = Array.isArray(params.type) ? params.type.join('/') : (params.type || '');
    const docType = typeParam.toLowerCase();
    const price = DOCUMENT_PRICES[docType] || 500;

    // Check balance
    if (user.balance < price) {
      return new Response(JSON.stringify({
        success: false,
        error: `Saldo insuficiente. Necessário: R$ ${(price / 100).toFixed(2)}. Disponível: R$ ${(user.balance / 100).toFixed(2)}`
      }), { status: 402, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const codigoValidacao = generateCode();
    const docId = codigoValidacao;

    // Deduct balance
    await env.DB.prepare(
      'UPDATE users SET balance = balance - ? WHERE id = ?'
    ).bind(price, user.id).run();

    // Record transaction
    await env.DB.prepare(
      'INSERT INTO transactions (user_id, type, amount, description, document_type, document_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, 'debit', price, `Emissão de ${docType.toUpperCase()}`, docType, docId).run();

    // Save document with status='emitido' for validation
    await env.DB.prepare(
      'INSERT INTO documents (id, user_id, type, data, codigo_qr, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(docId, user.id, docType, JSON.stringify(body), codigoValidacao, 'emitido').run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: docId,
        codigoValidacao,
        type: docType,
      }
    }), { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
