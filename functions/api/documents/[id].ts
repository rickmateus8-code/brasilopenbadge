/**
 * /api/documents/[id] — GET, PUT, DELETE para documentos genéricos (CNH, CHA, etc.)
 * Também trata POST quando [id] é um tipo de documento (cnh, cha, toxicologico, etc.)
 * Tabela: documents (D1)
 */
import type { Env } from '../../types';

// Known document types — when [id] matches one of these, POST creates a new document
const DOCUMENT_TYPES = ['cnh', 'cha', 'toxicologico', 'historico-sp', 'historico-uninter'];

const DOCUMENT_PRICES: Record<string, number> = {
  'cnh': 500,
  'cha': 500,
  'toxicologico': 500,
  'historico-sp': 500,
  'historico-uninter': 500,
};

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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
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

export async function onRequest(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;
  const idOrType = params.id;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const token = getSessionToken(request);
  const user = await getAuthUser(env, token);
  if (!user) {
    return jsonResponse({ success: false, error: "Não autenticado." }, 401);
  }

  try {
    // ── POST: Create new document (when [id] is a document type like "cnh") ──
    if (request.method === "POST") {
      const docType = idOrType.toLowerCase();
      if (!DOCUMENT_TYPES.includes(docType)) {
        return jsonResponse({ success: false, error: "Tipo de documento inválido." }, 400);
      }

      const price = DOCUMENT_PRICES[docType] || 500;

      // Check balance
      if (user.balance < price) {
        return jsonResponse({
          success: false,
          error: `Saldo insuficiente. Necessário: R$ ${(price / 100).toFixed(2)}. Disponível: R$ ${(user.balance / 100).toFixed(2)}`
        }, 402);
      }

      const body = await request.json<any>();
      const codigoValidacao = generateCode();
      const docId = codigoValidacao;

      // Deduct balance
      await env.DB.prepare(
        'UPDATE users SET balance = balance - ? WHERE id = ?'
      ).bind(price, user.id).run();

      // Record transaction (id is AUTOINCREMENT, omit it)
      await env.DB.prepare(
        'INSERT INTO transactions (user_id, type, amount, description, document_type, document_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(user.id, 'debit', price, `Emissão de ${docType.toUpperCase()}`, docType, docId).run();

      // Extract key fields for direct column storage
      const nome = body.nome || body.nomeCompleto || body.paciente || '';
      const cpf = body.cpf || '';
      const categoria = body.categoria || body.cat || '';
      const senha = String(Math.floor(1000 + Math.random() * 9000));

      // Save document with direct columns
      await env.DB.prepare(
        'INSERT INTO documents (id, user_id, type, data, codigo_qr, status, nome, cpf, senha, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
      ).bind(docId, user.id, docType, JSON.stringify(body), codigoValidacao, 'emitido', nome, cpf, senha, categoria).run();

      return jsonResponse({
        success: true,
        data: {
          id: docId,
          codigoValidacao,
          type: docType,
        }
      }, 201);
    }

    // ── GET: List documents by type OR retrieve single document by ID ──
    if (request.method === "GET") {
      const docTypeOrId = idOrType.toLowerCase();

      // If it's a known document type, list all documents of that type
      if (DOCUMENT_TYPES.includes(docTypeOrId)) {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        let results;
        if (user.role === "admin") {
          results = await env.DB.prepare(
            "SELECT d.*, u.display_name as user_name FROM documents d LEFT JOIN users u ON d.user_id = u.id WHERE d.type = ? ORDER BY d.created_at DESC LIMIT ?"
          ).bind(docTypeOrId, limit).all();
        } else {
          results = await env.DB.prepare(
            "SELECT * FROM documents WHERE type = ? AND user_id = ? ORDER BY created_at DESC LIMIT ?"
          ).bind(docTypeOrId, user.id, limit).all();
        }

        // Parse JSON data field for each document and extract nome
        const documents = (results.results || []).map((doc: any) => {
          let parsedData: any = {};
          try { if (doc.data) parsedData = JSON.parse(doc.data); } catch {}
          return {
            id: doc.id,
            type: doc.type,
            nome: doc.nome || parsedData.nome || parsedData.nomeCompleto || parsedData.paciente || 'Sem nome',
            cpf: doc.cpf || parsedData.cpf || '',
            senha: doc.senha || '',
            categoria: doc.categoria || parsedData.categoria || parsedData.cat || '',
            codigo_qr: doc.codigo_qr,
            status: doc.status || 'emitido',
            created_at: doc.created_at,
            user_id: doc.user_id,
            user_name: doc.user_name,
            data: doc.data,
          };
        });

        return jsonResponse({ success: true, data: documents });
      }

      // Otherwise, retrieve single document by ID
      const docId = idOrType;
      let doc;
      if (user.role === "admin") {
        doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      } else {
        doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ? AND user_id = ? LIMIT 1").bind(docId, user.id).first<any>();
      }
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);

      // Parse JSON data field
      let parsedData = {};
      try {
        if (doc.data) parsedData = JSON.parse(doc.data);
      } catch { /* ignore */ }

      return jsonResponse({ success: true, data: { ...doc, ...parsedData } });
    }

    // ── PUT: Update document ──
    if (request.method === "PUT") {
      const docId = idOrType;
      const doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);
      if (user.role !== "admin" && doc.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }

      const body = await request.json<any>();
      const now = new Date().toISOString();

      // CPF BLOQUEADO — não pode ser alterado após emissão (regra universal)
      let existingData: any = {};
      try { if (doc.data) existingData = JSON.parse(doc.data); } catch { /* ignore */ }
      body.cpf = existingData.cpf; // Preservar CPF original

      await env.DB.prepare(`
        UPDATE documents SET
          data = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(JSON.stringify(body), now, docId).run();

      return jsonResponse({ success: true, message: "Documento atualizado com sucesso." });
    }

    // ── DELETE: Cancel document ──
    if (request.method === "DELETE") {
      const docId = idOrType;
      const doc = await env.DB.prepare("SELECT id, user_id FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);
      if (user.role !== "admin" && doc.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }
      await env.DB.prepare("UPDATE documents SET status = 'cancelado', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), docId).run();
      return jsonResponse({ success: true, message: "Documento cancelado com sucesso." });
    }

    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
  } catch (error) {
    console.error("[documents/[id]] Erro:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Erro interno." }, 500);
  }
}
