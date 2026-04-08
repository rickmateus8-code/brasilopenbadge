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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    // 1. Autenticação
    const user = await getAuthUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), {
        status: 401, headers: CORS_HEADERS
      });
    }

    const typeParam = Array.isArray(params.type) ? params.type.join('/') : (params.type || '');
    const docType = typeParam.toLowerCase();

    // 2. Buscar preço DINÂMICO do banco D1 (vinculado ao Admin) — nunca hardcoded
    let price = 0;
    if (user.role !== 'admin') {
      const pricing = await env.DB.prepare(
        'SELECT price FROM document_pricing WHERE document_type = ? AND is_active = 1 LIMIT 1'
      ).bind(docType).first<{ price: number }>();

      if (!pricing) {
        // Fallback: usar valor padrão de R$ 5,00
        price = 500;
      } else {
        price = pricing.price;
      }

      // 3. Verificar saldo ANTES de qualquer operação (leitura fresca do banco)
      const currentUser = await env.DB.prepare(
        'SELECT balance FROM users WHERE id = ? LIMIT 1'
      ).bind(user.id).first<{ balance: number }>();

      const currentBalance = currentUser?.balance ?? 0;
      if (currentBalance < price) {
        return new Response(JSON.stringify({
          success: false,
          error: `Saldo insuficiente. Necessário: R$ ${(price / 100).toFixed(2)}. Disponível: R$ ${(currentBalance / 100).toFixed(2)}. Recarregue seu saldo para continuar.`,
          code: 'INSUFFICIENT_BALANCE',
          required: price,
          available: currentBalance,
        }), { status: 402, headers: CORS_HEADERS });
      }
    }

    const body = await request.json() as any;
    const codigoValidacao = generateCode();
    const docId = codigoValidacao;

    // 4. Débito ATÔMICO (apenas para não-admin)
    let newBalance = user.balance; // Default: saldo anterior (para admin)
    if (user.role !== 'admin' && price > 0) {
      const updated = await env.DB.prepare(
        'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ? RETURNING balance'
      ).bind(price, user.id, price).first<{ balance: number }>();

      if (!updated) {
        // Race condition: saldo insuficiente no momento exato do débito
        return new Response(JSON.stringify({
          success: false,
          error: 'Saldo insuficiente no momento da emissão. Recarregue seu saldo e tente novamente.',
          code: 'INSUFFICIENT_BALANCE',
        }), { status: 402, headers: CORS_HEADERS });
      }
      newBalance = updated.balance; // Atualizar com o novo saldo
    }

    // 5. Registrar transação para auditoria
    if (price > 0 && user.role !== 'admin') {
      await env.DB.prepare(
        'INSERT INTO transactions (user_id, type, amount, description, document_type, document_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(user.id, 'debit', price, `Emissão de ${docType.toUpperCase()}`, docType, docId).run();
    }

    // Compress base64 images to stay within D1 1MB column limit
    // Keep fotoUrl and assinaturaUrl (needed for cnh-do-brasil rendering)
    // but strip other large base64 fields
    const dataToStore = { ...body };
    const stripFields = ['foto', 'assinatura', 'signatureImage', 'signature_image'];
    for (const field of stripFields) {
      if (dataToStore[field] && typeof dataToStore[field] === 'string' && dataToStore[field].startsWith('data:')) {
        dataToStore[field] = '';
      }
    }
    // Keep fotoUrl and assinaturaUrl as-is (frontend should compress before sending)
    // If total JSON is too large, strip images as fallback
    let jsonData = JSON.stringify(dataToStore);
    if (jsonData.length > 900000) {
      // Too large - strip fotoUrl and assinaturaUrl as fallback
      dataToStore.fotoUrl = '';
      dataToStore.assinaturaUrl = '';
      dataToStore.fotoUrl_stripped = true;
      dataToStore.assinaturaUrl_stripped = true;
      jsonData = JSON.stringify(dataToStore);
    }

    // Extract key fields for top-level columns (used by cnh-do-brasil auth)
    const cpfValue = body.cpf || '';
    const senhaValue = body.senhaApp || body.senha || '';
    const nomeValue = body.nome || body.nomeCompleto || '';
    const categoriaValue = body.categoria || '';

    // Save     // Save document with status='emitido' for validation
    // Include cpf, senha, nome, categoria as separate columns for cnh-do-brasil auth lookup
    await env.DB.prepare(
      'INSERT INTO documents (id, user_id, type, data, codigo_qr, status, cpf, senha, nome, categoria, codigo_validacao, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(docId, user.id, docType, jsonData, codigoValidacao, 'emitido', cpfValue, senhaValue, nomeValue, categoriaValue, codigoValidacao).run();

    // Buscar saldo atualizado após débito para atualização em tempo real no frontend
    const updatedUser = await env.DB.prepare(
      'SELECT balance FROM users WHERE id = ? LIMIT 1'
    ).bind(user.id).first<{ balance: number }>();

    return new Response(JSON.stringify({
      success: true,
      balance: updatedUser?.balance ?? 0,
      data: {
        id: docId,
        codigoValidacao,
        type: docType,
      }
    }), { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno' }), { status: 500, headers: CORS_HEADERS });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
