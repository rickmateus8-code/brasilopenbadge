/**
 * /api/attestations — Endpoint seguro de emissão de atestados
 *
 * SEGURANÇA ANTI-BURLA:
 * 1. Autenticação obrigatória via cookie HttpOnly (sessão no banco D1)
 * 2. Verificação de saldo ANTES de qualquer inserção
 * 3. QR Code gerado EXCLUSIVAMENTE no servidor — nunca no cliente
 * 4. Código único verificado no banco antes de inserir (sem colisões)
 * 5. Débito de saldo e inserção do documento em operações sequenciais
 *    com verificação de integridade
 * 6. GET protegido — usuário só vê seus próprios documentos
 * 7. Admin pode ver todos os documentos
 */

import type { Env } from '../types';

// ─── Helpers de autenticação ──────────────────────────────────────────────────

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

// ─── Gerador de código QR único ───────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 8; i++) {
    code += chars[arr[i] % chars.length];
  }
  return `${code.slice(0, 4)}.${code.slice(4)}`;
}

async function generateUniqueCode(env: Env): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    // Verifica em attestations E documents para garantir unicidade global
    const existsAtt = await env.DB.prepare(
      "SELECT id FROM attestations WHERE codigo_qr = ? LIMIT 1"
    ).bind(code).first();
    const existsDoc = await env.DB.prepare(
      "SELECT id FROM documents WHERE codigo_qr = ? LIMIT 1"
    ).bind(code).first().catch(() => null);
    if (!existsAtt && !existsDoc) return code;
  }
  throw new Error("Não foi possível gerar um código único. Tente novamente.");
}

// ─── Preço do documento ───────────────────────────────────────────────────────

async function getDocumentPrice(env: Env, tipo: string): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT price FROM document_pricing WHERE document_type = ? AND is_active = 1 LIMIT 1"
  ).bind(tipo).first<{ price: number }>();
  return row ? row.price : 0;
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

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

// ─── Handler principal ────────────────────────────────────────────────────────

export async function onRequest(context: { request: Request; env: Env; params: any }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const token = getSessionToken(request);
  const user = await getAuthUser(env, token);

  if (!user) {
    return jsonResponse({ success: false, error: "Não autenticado. Faça login para continuar." }, 401);
  }

  // Verificar se há um ID na URL (ex: /api/attestations/XXXX)
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const attestationId = pathParts.length >= 3 ? pathParts[2] : null;

  try {
    if (request.method === "GET" && attestationId) {
      return handleGetAttestationById(env, user, attestationId);
    }
    if (request.method === "GET") {
      return handleGetAttestations(env, user);
    }
    if (request.method === "POST") {
      return handleCreateAttestation(request, env, user);
    }
    if (request.method === "PUT" && attestationId) {
      return handleUpdateAttestation(request, env, user, attestationId);
    }
    if (request.method === "DELETE" && attestationId) {
      return handleDeleteAttestation(env, user, attestationId);
    }
    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
  } catch (error) {
    console.error("[attestations] Erro:", error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor.",
    }, 500);
  }
}

// ─── GET — Listar atestados ───────────────────────────────────────────────────

async function handleGetAttestations(env: Env, user: any) {
  let rows;
  if (user.role === "admin") {
    // Admin vê todos
    rows = await env.DB.prepare(
      `SELECT a.*, u.username FROM attestations a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC LIMIT 200`
    ).all();
  } else {
    // Usuário vê apenas os seus
    rows = await env.DB.prepare(
      "SELECT * FROM attestations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(user.id).all();
  }

  return jsonResponse({
    success: true,
    data: rows.results || [],
    count: (rows.results || []).length,
  });
}

// ─── POST — Criar atestado (com segurança completa) ───────────────────────────

async function handleCreateAttestation(request: Request, env: Env, user: any) {
  const body = await request.json<any>();

  // 1. Validação dos campos obrigatórios
  const required = ["paciente", "sexo", "nascimento", "medico", "crm", "especialidade"];
  const missing = required.filter((f) => !body[f]);
  if (missing.length > 0) {
    return jsonResponse({
      success: false,
      error: `Campos obrigatórios ausentes: ${missing.join(", ")}`,
    }, 400);
  }

  // Pelo menos CPF ou CNS deve estar presente
  if (!body.cpf && !body.cns && !body.docValue) {
    return jsonResponse({
      success: false,
      error: "CPF ou CNS do paciente é obrigatório.",
    }, 400);
  }

  // 2. Verificar saldo do usuário (usuários comuns precisam de saldo)
  const price = await getDocumentPrice(env, "atestado");
  if (user.role !== "admin" && price > 0) {
    const currentUser = await env.DB.prepare(
      "SELECT balance FROM users WHERE id = ? LIMIT 1"
    ).bind(user.id).first<{ balance: number }>();

    const balance = currentUser?.balance ?? 0;
    if (balance < price) {
      return jsonResponse({
        success: false,
        error: `Saldo insuficiente. Saldo atual: R$ ${(balance / 100).toFixed(2)}. Necessário: R$ ${(price / 100).toFixed(2)}. Recarregue seu saldo para continuar.`,
        needsRecharge: true,
      }, 402);
    }
  }

  // 3. Gerar código QR único no servidor
  const codigoQR = await generateUniqueCode(env);

  // 4. Preparar dados do documento
  const docValue = body.docValue || body.cpf || body.cns || "";
  const tipoDoc = body.tipoDoc || (body.cns ? "CNS" : "CPF");
  const cpf = tipoDoc === "CPF" ? docValue : (body.cpf || "");
  const cns = tipoDoc === "CNS" ? docValue : (body.cns || "");

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  const now = new Date().toISOString();

  // 5. Inserir no banco D1
  await env.DB.prepare(`
    INSERT INTO attestations (
      id, user_id, codigo_qr, paciente, sexo, nascimento, cpf, cns, tipo_doc,
      nome_mae, endereco, cid, cid_display, cid_nome,
      medico, crm, especialidade, instituicao, unidade, endereco_emitente,
      texto_atestado, afastamento, data_assinatura, hora_assinatura, data_emissao,
      logo_url, logo_right, signature_color, signature_image, modo_carimbo,
      cidade, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, 'emitido', ?, ?
    )
  `).bind(
    id, user.id, codigoQR,
    body.paciente?.toUpperCase() || "",
    body.sexo || "FEMALE",
    body.nascimento || "",
    cpf, cns, tipoDoc,
    body.nomeMae?.toUpperCase() || body.nome_mae?.toUpperCase() || "",
    body.endereco?.toUpperCase() || "",
    body.cid || "",
    body.cidDisplay || body.cid || "",
    body.cidNome || "",
    body.medico?.toUpperCase() || "",
    body.crm || "",
    body.especialidade?.toUpperCase() || "",
    body.instituicao?.toUpperCase() || "CLÍNICA / HOSPITAL",
    body.unidade?.toUpperCase() || "",
    body.enderecoEmitente?.toUpperCase() || body.endereco_emitente?.toUpperCase() || "",
    body.textoAtestado || body.texto_atestado || "",
    body.afastamento || "3",
    body.dataAssinatura || body.data_assinatura || "",
    body.horaAssinatura || body.hora_assinatura || "",
    body.dataEmissao || body.data_emissao || "",
    body.logoUrl || body.logo_url || "",
    body.logoRight || body.logo_right || "",
    body.signatureColor || "#0b109f",
    body.signatureImage || "",
    body.modoCarimbo ? 1 : 0,
    body.cidade || "",
    now, now
  ).run();

  // 6. Debitar saldo (apenas se há preço e não é admin)
  let newBalance = user.balance;
  if (user.role !== "admin" && price > 0) {
    const updated = await env.DB.prepare(
      "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ? RETURNING balance"
    ).bind(price, user.id, price).first<{ balance: number }>();

    if (!updated) {
      // Rollback: remover atestado inserido
      await env.DB.prepare("DELETE FROM attestations WHERE id = ?").bind(id).run();
      return jsonResponse({
        success: false,
        error: "Saldo insuficiente. O atestado não foi emitido.",
        needsRecharge: true,
      }, 402);
    }
    newBalance = updated.balance;

    // Registrar transação no extrato
    await env.DB.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, document_id, created_at)
      VALUES (?, ?, 'debit', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      user.id,
      price,
      `Emissão de Atestado — ${body.paciente?.toUpperCase() || "PACIENTE"}`,
      id,
      now
    ).run();
  }

  // 7. Apagar CPF após emissão (regra de privacidade — CPF não é armazenado após emissão)
  await env.DB.prepare(
    "UPDATE attestations SET cpf = NULL, cns = NULL WHERE id = ?"
  ).bind(id).run();

  return jsonResponse({
    success: true,
    message: "Atestado emitido com sucesso.",
    codigoQR,
    notice: "⚠️ Aviso: Este documento será excluído automaticamente após 60 dias. Faça o download agora.",
    data: {
      id,
      codigoQR,
      paciente: body.paciente?.toUpperCase(),
      medico: body.medico?.toUpperCase(),
      dataEmissao: body.dataEmissao || body.data_emissao,
      status: "emitido",
    },
    newBalance,
  }, 201);
}

// ─── GET por ID ───────────────────────────────────────────────────────────────

async function handleGetAttestationById(env: Env, user: any, id: string) {
  let attestation;
  if (user.role === "admin") {
    attestation = await env.DB.prepare(
      "SELECT * FROM attestations WHERE id = ? LIMIT 1"
    ).bind(id).first<any>();
  } else {
    attestation = await env.DB.prepare(
      "SELECT * FROM attestations WHERE id = ? AND user_id = ? LIMIT 1"
    ).bind(id, user.id).first<any>();
  }

  if (!attestation) {
    return jsonResponse({ success: false, error: "Atestado não encontrado." }, 404);
  }

  return jsonResponse({ success: true, data: attestation });
}

// ─── PUT — Editar atestado (CPF bloqueado) ──────────────────────────────────

async function handleUpdateAttestation(request: Request, env: Env, user: any, id: string) {
  // Verificar se o atestado existe e pertence ao usuário
  let attestation;
  if (user.role === "admin") {
    attestation = await env.DB.prepare(
      "SELECT * FROM attestations WHERE id = ? LIMIT 1"
    ).bind(id).first<any>();
  } else {
    attestation = await env.DB.prepare(
      "SELECT * FROM attestations WHERE id = ? AND user_id = ? LIMIT 1"
    ).bind(id, user.id).first<any>();
  }

  if (!attestation) {
    return jsonResponse({ success: false, error: "Atestado não encontrado ou sem permissão." }, 404);
  }

  const body = await request.json<any>();

  // SEGURANÇA: CPF NÃO pode ser alterado após emissão
  // O campo CPF é ignorado completamente no update

  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE attestations SET
      paciente = COALESCE(?, paciente),
      sexo = COALESCE(?, sexo),
      nascimento = COALESCE(?, nascimento),
      nome_mae = COALESCE(?, nome_mae),
      endereco = COALESCE(?, endereco),
      cid = COALESCE(?, cid),
      cid_display = COALESCE(?, cid_display),
      cid_nome = COALESCE(?, cid_nome),
      medico = COALESCE(?, medico),
      crm = COALESCE(?, crm),
      especialidade = COALESCE(?, especialidade),
      instituicao = COALESCE(?, instituicao),
      unidade = COALESCE(?, unidade),
      endereco_emitente = COALESCE(?, endereco_emitente),
      texto_atestado = COALESCE(?, texto_atestado),
      afastamento = COALESCE(?, afastamento),
      data_assinatura = COALESCE(?, data_assinatura),
      hora_assinatura = COALESCE(?, hora_assinatura),
      data_emissao = COALESCE(?, data_emissao),
      logo_url = COALESCE(?, logo_url),
      logo_right = COALESCE(?, logo_right),
      signature_color = COALESCE(?, signature_color),
      signature_image = COALESCE(?, signature_image),
      modo_carimbo = COALESCE(?, modo_carimbo),
      cidade = COALESCE(?, cidade),
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.paciente?.toUpperCase() || null,
    body.sexo || null,
    body.nascimento || null,
    body.nomeMae?.toUpperCase() || body.nome_mae?.toUpperCase() || null,
    body.endereco?.toUpperCase() || null,
    body.cid || null,
    body.cidDisplay || body.cid_display || null,
    body.cidNome || body.cid_nome || null,
    body.medico?.toUpperCase() || null,
    body.crm || null,
    body.especialidade?.toUpperCase() || null,
    body.instituicao?.toUpperCase() || null,
    body.unidade?.toUpperCase() || null,
    body.enderecoEmitente?.toUpperCase() || body.endereco_emitente?.toUpperCase() || null,
    body.textoAtestado || body.texto_atestado || null,
    body.afastamento || null,
    body.dataAssinatura || body.data_assinatura || null,
    body.horaAssinatura || body.hora_assinatura || null,
    body.dataEmissao || body.data_emissao || null,
    body.logoUrl || body.logo_url || null,
    body.logoRight || body.logo_right || null,
    body.signatureColor || body.signature_color || null,
    body.signatureImage || body.signature_image || null,
    body.modoCarimbo !== undefined ? (body.modoCarimbo ? 1 : 0) : null,
    body.cidade || null,
    now,
    id
  ).run();

  // Buscar o atestado atualizado
  const updated = await env.DB.prepare(
    "SELECT * FROM attestations WHERE id = ? LIMIT 1"
  ).bind(id).first<any>();

  return jsonResponse({
    success: true,
    message: "Atestado atualizado com sucesso.",
    data: updated,
  });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

async function handleDeleteAttestation(env: Env, user: any, id: string) {
  // Verificar se o atestado existe e pertence ao usuário
  let attestation;
  if (user.role === "admin") {
    attestation = await env.DB.prepare(
      "SELECT id FROM attestations WHERE id = ? LIMIT 1"
    ).bind(id).first<any>();
  } else {
    attestation = await env.DB.prepare(
      "SELECT id FROM attestations WHERE id = ? AND user_id = ? LIMIT 1"
    ).bind(id, user.id).first<any>();
  }

  if (!attestation) {
    return jsonResponse({ success: false, error: "Atestado não encontrado ou sem permissão." }, 404);
  }

  await env.DB.prepare("DELETE FROM attestations WHERE id = ?").bind(id).run();

  return jsonResponse({ success: true, message: "Atestado excluído com sucesso." });
}
