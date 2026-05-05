/**
 * /api/documents/[id] — GET, PUT, DELETE para documentos genéricos (CNH, CHA, etc.)
 * Também trata POST quando [id] é um tipo de documento (cnh, cha, toxicologico, etc.)
 * Tabela: documents (D1)
 */
import type { Env } from '../../types';

// Known document types — when [id] matches one of these, POST creates a new document
const DOCUMENT_TYPES = ['cnh', 'cha', 'toxicologico', 'historico-sp', 'historico-uninter', 'peticaocria', 'peticao-stj'];

const DOCUMENT_PRICES: Record<string, number> = {
  'cnh': 1500,
  'cha': 1500,
  'toxicologico': 1500,
  'historico-sp': 1800,
  'historico-uninter': 1800,
  'peticaocria': 2000,
  'peticao-stj': 2000,
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

function generateValidationId(): string {
  // Generate a UUID v4-like string for QR code validation
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hex.charAt(Math.floor(Math.random() * 4) + 8);
    } else {
      uuid += hex.charAt(Math.floor(Math.random() * 16));
    }
  }
  return uuid;
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

      // Buscar o preço e validade diretamente do Template no Banco D1 (Motor Universal)
      const template = await env.DB.prepare(
        "SELECT price, is_active FROM document_templates WHERE slug = ? LIMIT 1"
      ).bind(docType).first<any>();

      let price = DOCUMENT_PRICES[docType] || 500;

      if (template) {
        if (!template.is_active) {
          return jsonResponse({ success: false, error: "Este template de documento está desativado." }, 403);
        }
        // O banco armazena REAL (R$ 20.00), convertemos para centavos (2000)
        price = Math.round(template.price * 100);
      } else if (!DOCUMENT_TYPES.includes(docType)) {
        return jsonResponse({ success: false, error: "Tipo de documento inválido ou template não encontrado." }, 400);
      }

      const freeDocuments = JSON.parse(user.free_documents || '[]');
      const isFree = freeDocuments.includes(docType);

      // Check balance (skip if free or admin)
      if (user.role !== "admin" && !isFree && user.balance < price) {
        return jsonResponse({
          success: false,
          error: `Saldo insuficiente. Necessário: R$ ${(price / 100).toFixed(2)}. Disponível: R$ ${(user.balance / 100).toFixed(2)}`
        }, 402);
      }

      const body = await request.json<any>();
      const codigoValidacao = generateCode();
      const validationId = generateValidationId();
      const docId = codigoValidacao;

      // Deduct balance (skip if free or admin)
      if (user.role !== "admin" && !isFree && price > 0) {
        await env.DB.prepare(
          'UPDATE users SET balance = balance - ? WHERE id = ?'
        ).bind(price, user.id).run();

        // Record transaction
        await env.DB.prepare(
          'INSERT INTO transactions (user_id, type, amount, description, document_type, document_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(user.id, 'debit', price, `Emissão de ${docType.toUpperCase()}`, docType, docId).run();
      }

      // Extract key fields for direct column storage
      const nome = body.nome || body.nomeCompleto || body.paciente || '';
      const cpf = body.cpf || '';
      const categoria = body.categoria || body.cat || '';
      const senha = String(Math.floor(1000 + Math.random() * 9000));

      // Generate sequential numeric ID for CNH (unique per type)
      let seqId: number | null = null;
      if (docType === 'cnh') {
        try {
          const maxSeq = await env.DB.prepare(
            "SELECT MAX(CAST(seq_id AS INTEGER)) as max_seq FROM documents WHERE type = 'cnh' AND seq_id IS NOT NULL"
          ).first<{ max_seq: number | null }>();
          seqId = (maxSeq?.max_seq || 14000) + Math.floor(Math.random() * 5) + 1;
        } catch {
          seqId = 14000 + Math.floor(Math.random() * 2000);
        }
      }

      // Save document with direct columns + validation_id + seq_id for QR code
      try {
        await env.DB.prepare(
          'INSERT INTO documents (id, user_id, type, data, codigo_qr, validation_id, seq_id, status, nome, cpf, senha, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
        ).bind(docId, user.id, docType, JSON.stringify(body), codigoValidacao, validationId, seqId, 'emitido', nome, cpf, senha, categoria).run();
      } catch (insertErr: any) {
        // Fallback: try without seq_id or validation_id
        try {
          await env.DB.prepare(
            'INSERT INTO documents (id, user_id, type, data, codigo_qr, validation_id, status, nome, cpf, senha, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
          ).bind(docId, user.id, docType, JSON.stringify(body), codigoValidacao, validationId, 'emitido', nome, cpf, senha, categoria).run();
        } catch {
          await env.DB.prepare(
            'INSERT INTO documents (id, user_id, type, data, codigo_qr, status, nome, cpf, senha, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
          ).bind(docId, user.id, docType, JSON.stringify(body), codigoValidacao, 'emitido', nome, cpf, senha, categoria).run();
        }
      }

      // Log admin notification for new emission
      try {
        await env.DB.prepare(
          `INSERT INTO system_logs (id, user_id, action, category, details, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          crypto.randomUUID(),
          user.id,
          `Documento ${docType.toUpperCase()} emitido por ${user.username}`,
          'emission',
          JSON.stringify({ type: docType, nome, cpf, codigo: codigoValidacao, price })
        ).run();
      } catch { /* non-critical */ }

      return jsonResponse({
        success: true,
        data: {
          id: docId,
          codigoValidacao,
          validationId,
          seqId,
          senha,
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

        // Primeiro, contar TODOS os documentos deste tipo para gerar seq_id universal
        let totalCount = 0;
        if (user.role === "admin") {
          const countResult = await env.DB.prepare(
            "SELECT COUNT(*) as cnt FROM documents WHERE type = ?"
          ).bind(docTypeOrId).first<{ cnt: number }>();
          totalCount = countResult?.cnt || 0;
        } else {
          const countResult = await env.DB.prepare(
            "SELECT COUNT(*) as cnt FROM documents WHERE type = ? AND user_id = ?"
          ).bind(docTypeOrId, user.id).first<{ cnt: number }>();
          totalCount = countResult?.cnt || 0;
        }

        let results;
        if (user.role === "admin") {
          results = await env.DB.prepare(
            "SELECT d.*, u.display_name as user_name FROM documents d LEFT JOIN users u ON d.user_id = u.id WHERE d.type = ? ORDER BY d.created_at ASC LIMIT ?"
          ).bind(docTypeOrId, limit).all();
        } else {
          results = await env.DB.prepare(
            "SELECT * FROM documents WHERE type = ? AND user_id = ? ORDER BY created_at ASC LIMIT ?"
          ).bind(docTypeOrId, user.id, limit).all();
        }

        // Parse JSON data field for each document and extract nome
        // seq_id: 1 = primeiro emitido, crescente
        const documents = (results.results || []).map((doc: any, index: number) => {
          let parsedData: any = {};
          try { if (doc.data) parsedData = JSON.parse(doc.data); } catch {}
          return {
            id: doc.id,
            seq_id: doc.seq_id || (index + 1), // ID numérico sequencial do banco ou fallback
            type: doc.type,
            nome: doc.nome || parsedData.nome || parsedData.nomeCompleto || parsedData.paciente || 'Sem nome',
            cpf: doc.cpf || parsedData.cpf || '',
            senha: doc.senha || '',
            categoria: doc.categoria || parsedData.categoria || parsedData.cat || '',
            codigo_qr: doc.codigo_qr,
            validation_id: doc.validation_id || '',
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

      const rawBody = await request.json<any>();
      const now = new Date().toISOString();

      // DocumentosSalvos.tsx sends { data: { ... } }, direct calls send fields at root
      const editPayload = rawBody.data || rawBody;

      // CPF BLOQUEADO — não pode ser alterado após emissão (regra universal)
      let existingData: any = {};
      try { if (doc.data) existingData = JSON.parse(doc.data); } catch { /* ignore */ }

      // Merge: keep existing data, overlay with new edits
      const mergedData = { ...existingData, ...editPayload };
      mergedData.cpf = existingData.cpf; // Preservar CPF original

      // Also update direct columns if present
      const nome = editPayload.nome || editPayload.nomeCompleto || editPayload.paciente || doc.nome;

      await env.DB.prepare(`
        UPDATE documents SET
          data = ?,
          nome = COALESCE(?, nome),
          updated_at = ?
        WHERE id = ?
      `).bind(JSON.stringify(mergedData), nome || null, now, docId).run();

      return jsonResponse({ success: true, message: "Documento atualizado com sucesso." });
    }

    // ── DELETE: Delete document permanently ──
    if (request.method === "DELETE") {
      const docId = idOrType;
      const doc = await env.DB.prepare("SELECT id, user_id FROM documents WHERE id = ? LIMIT 1").bind(docId).first<any>();
      if (!doc) return jsonResponse({ success: false, error: "Documento não encontrado." }, 404);
      if (user.role !== "admin" && doc.user_id !== user.id) {
        return jsonResponse({ success: false, error: "Sem permissão." }, 403);
      }
      await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(docId).run();
      return jsonResponse({ success: true, message: "Documento excluído com sucesso." });
    }

    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
  } catch (error) {
    console.error("[documents/[id]] Erro:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Erro interno." }, 500);
  }
}
