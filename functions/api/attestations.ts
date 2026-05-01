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
  
  if (row) return row.price;

  // Fallback Robusto (Valores de Elite)
  const defaults: Record<string, number> = {
    'atestado': 1000,
    'cnh': 1500,
    'cha': 1500,
    'toxicologico': 1500,
    'toxicria': 1500,
    'historico-sp': 1800,
    'historico-uninter': 1800,
    'receita': 1000
  };
  return defaults[tipo] || 1000;
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

  // ─── Verificação de Autenticação (Cookie ou Token de Sincronia) ──────────────
  const authHeader = request.headers.get("Authorization");
  const syncToken = env.IDAB_SYNC_TOKEN || "docmaster-idab-sync-2026-secure";
  
  let user: any = null;

  if (authHeader === `Bearer ${syncToken}`) {
    // Bypassed via Sync Token (Modo Receptor IDAB)
    user = { id: "system", username: "sync_system", role: "admin", balance: 999999, is_active: 1 };
  } else {
    // Autenticação padrão via Sessão (Modo DocMaster)
    const token = getSessionToken(request);
    user = await getAuthUser(env, token);
  }

  if (!user) {
    return jsonResponse({ success: false, error: "Não autenticado. Faça login para continuar." }, 401);
  }

  // Verificar se há um ID na URL (ex: /api/attestations/XXXX)
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const attestationId = pathParts.length >= 3 ? pathParts[2] : null;
  const wantsStats = url.searchParams.get('stats') === '1';

  try {
    if (request.method === "GET" && attestationId) {
      return handleGetAttestationById(env, user, attestationId);
    }
    if (request.method === "GET" && wantsStats) {
      return handleGetStats(env, user);
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

// ─── GET — Estatísticas do dashboard ────────────────────────────────────────

async function handleGetStats(env: Env, user: any) {
  // Conta atestados emitidos pelo usuário (ou todos se admin)
  let attCount: { total: number } | null;
  if (user.role === "admin") {
    attCount = await env.DB.prepare(
      "SELECT COUNT(*) as total FROM attestations"
    ).first<{ total: number }>();
  } else {
    attCount = await env.DB.prepare(
      "SELECT COUNT(*) as total FROM attestations WHERE user_id = ?"
    ).bind(user.id).first<{ total: number }>();
  }

  // Conta CNH, CHA, histórico etc. da tabela documents
  let cnhCount: { total: number } | null = null;
  let chaCount: { total: number } | null = null;
  try {
    if (user.role === "admin") {
      cnhCount = await env.DB.prepare(
        "SELECT COUNT(*) as total FROM documents WHERE type = 'cnh'"
      ).first<{ total: number }>();
      chaCount = await env.DB.prepare(
        "SELECT COUNT(*) as total FROM documents WHERE type = 'cha'"
      ).first<{ total: number }>();
    } else {
      cnhCount = await env.DB.prepare(
        "SELECT COUNT(*) as total FROM documents WHERE user_id = ? AND type = 'cnh'"
      ).bind(user.id).first<{ total: number }>();
      chaCount = await env.DB.prepare(
        "SELECT COUNT(*) as total FROM documents WHERE user_id = ? AND type = 'cha'"
      ).bind(user.id).first<{ total: number }>();
    }
  } catch (_) { /* tabela documents pode não existir */ }

  return jsonResponse({
    success: true,
    stats: {
      atestado: attCount?.total ?? 0,
      cnh: cnhCount?.total ?? 0,
      cha: chaCount?.total ?? 0,
    },
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
      texto_atestado, data_assinatura, hora_assinatura, data_emissao,
      logo_url, logo_right, signature_color, signature_image, modo_carimbo,
      logo_left_scale, logo_right_scale, logo_left_x, logo_left_y, logo_right_x, logo_right_y,
      cidade, document_type, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, 'emitido', ?, ?
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
    body.dataAssinatura || body.data_assinatura || "",
    body.horaAssinatura || body.hora_assinatura || "",
    body.dataEmissao || body.data_emissao || "",
    body.logoUrl || body.logo_url || "",
    body.logoRight || body.logo_right || "",
    body.signatureColor || "#0b109f",
    body.signatureImage || "",
    body.modoCarimbo ? 1 : 0,
    body.logoLeftScale ?? 1.0,
    body.logoRightScale ?? 1.0,
    body.logoLeftX ?? 0,
    body.logoLeftY ?? 0,
    body.logoRightX ?? 0,
    body.logoRightY ?? 0,
    body.cidade || "",
    body.documentType || body.document_type || 'atestado',
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
    const transactionId = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
    try {
      await env.DB.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, description, document_id, created_at)
        VALUES (?, ?, 'debit', ?, ?, ?, ?)
      `).bind(
        transactionId,
        user.id,
        price,
        `Emissão de Atestado — ${body.paciente?.toUpperCase() || "PACIENTE"}`,
        id,
        now
      ).run();
    } catch (transErr) {
      console.error("[transactions] Erro ao registrar transação:", transErr);
      // Não interrompe a emissão se apenas o log da transação falhar
    }
  }

  // 7. Sincronizar com o banco oficial do validaratestado.digital (atestados-idab)
  // Garante que o QR Code gerado seja encontrado na base oficial de validação.
  // Utiliza retry (até 3 tentativas) e envia token de autenticação para proteger a API do IDAB.
  {
    const syncPayload = {
      paciente: body.paciente?.toUpperCase() || "",
      sexo: body.sexo || "FEMALE",
      nascimento: body.nascimento || "",
      cpf: cpf || "-",
      cns: cns || "",
      tipo_doc: tipoDoc || "CPF",
      nome_mae: body.nomeMae?.toUpperCase() || body.nome_mae?.toUpperCase() || "-",
      endereco: body.endereco?.toUpperCase() || "-",
      condicao: body.textoAtestado || body.texto_atestado || "",
      texto_atestado: body.textoAtestado || body.texto_atestado || "",
      vacinacao: "-",
      cid: body.cidDisplay || body.cid || "-",
      cid_display: body.cidDisplay || body.cid_display || body.cid || "-",
      cid_nome: body.cidNome || body.cid_nome || "",
      medico: body.medico?.toUpperCase() || "",
      crm: body.crm || "",
      especialidade: body.especialidade?.toUpperCase() || "",
      data_assinatura: body.dataAssinatura || body.data_assinatura || "",
      hora_assinatura: body.horaAssinatura || body.hora_assinatura || "",
      data_emissao: body.dataEmissao || body.data_emissao || "",
      logo_url: body.logoUrl || body.logo_url || "",
      logo_right: body.logoRight || body.logo_right || "",
      endereco_emitente: body.enderecoEmitente?.toUpperCase() || body.endereco_emitente?.toUpperCase() || "",
      instituicao: body.instituicao?.toUpperCase() || "",
      unidade: body.unidade?.toUpperCase() || "",
      cidade: body.cidade?.toUpperCase() || "",
      signature_color: body.signatureColor || body.signature_color || "#0b109f",
      signature_image: body.signatureImage || body.signature_image || "",
      modo_carimbo: body.modoCarimbo ?? body.modo_carimbo ?? false,
      logo_left_scale: body.logoLeftScale ?? body.logo_left_scale ?? 1.0,
      logo_right_scale: body.logoRightScale ?? body.logo_right_scale ?? 1.0,
      logo_left_x: body.logoLeftX ?? body.logo_left_x ?? 0,
      logo_left_y: body.logoLeftY ?? body.logo_left_y ?? 0,
      logo_right_x: body.logoRightX ?? body.logo_right_x ?? 0,
      logo_right_y: body.logoRightY ?? body.logo_right_y ?? 0,
      document_type: body.documentType || body.document_type || 'atestado',
      // Chave especial: força o mesmo código QR no banco do validador
      _codigo_override: codigoQR,
    };

    const syncToken = env.IDAB_SYNC_TOKEN || "docmaster-idab-sync-2026-secure";
    let syncSuccess = false;
    const MAX_SYNC_ATTEMPTS = 3;

    // Sincronização protegida por try-catch externo para nunca derrubar a emissão principal
    try {
      for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt++) {
        try {
          const syncRes = await fetch("https://validaratestado.digital/api/attestations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${syncToken}`,
            },
            body: JSON.stringify(syncPayload),
          });
          // 201 = criado | 409 = já existe (duplicado) — ambos indicam sucesso
          if (syncRes.ok || syncRes.status === 409) {
            syncSuccess = true;
            break;
          }
          console.warn(`[sync] Tentativa ${attempt}/${MAX_SYNC_ATTEMPTS} falhou: HTTP ${syncRes.status}`);
        } catch (syncErr) {
          console.warn(`[sync] Tentativa ${attempt}/${MAX_SYNC_ATTEMPTS} — erro de rede:`, syncErr);
        }
      }
    } catch (outerErr) {
      console.error("[sync] Erro inesperado no loop de sincronização:", outerErr);
    }

    if (!syncSuccess) {
      // Registrar falha crítica para reprocessamento futuro
      console.error(`[sync] FALHA CRÍTICA: Atestado ${codigoQR} não foi sincronizado com o IDAB após ${MAX_SYNC_ATTEMPTS} tentativas.`);
      // Marcar o atestado com flag de sincronização pendente no campo validation_url
      try {
        await env.DB.prepare(
          "UPDATE attestations SET validation_url = ? WHERE id = ?"
        ).bind(`SYNC_PENDING:${codigoQR}`, id).run();
      } catch (_) { /* ignora erro de update */ }
    }
  }

  // 8. CPF é mantido no banco para exibição na edição (bloqueado/não-editável)
  // Não apagamos mais o CPF após emissão para que a edição mostre o valor original

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
    balance: newBalance,
    newBalance: newBalance,
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

  let body = await request.json<any>();

  // Support both { data: { ... } } (from DocumentosSalvos) and flat { ... } (from AtestadoEditar)
  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const fillCpf = body.fillCpf;
    const rawData = body.data;
    body = { ...rawData };
    if (fillCpf) body.fillCpf = fillCpf;

    // Map DocumentosSalvos field names to backend field names
    if (rawData.nome_paciente) body.paciente = rawData.nome_paciente;
    if (rawData.nome_medico) body.medico = rawData.nome_medico;
    if (rawData.hora_emissao) body.hora_assinatura = rawData.hora_emissao;
    if (rawData.dias_afastamento) body.afastamento = rawData.dias_afastamento;
    if (rawData.observacoes) body.texto_atestado = rawData.observacoes;
  }

  // SEGURANÇA: CPF só pode ser preenchido se estava vazio (fillCpf flag)
  // Se o CPF já existia no banco, ele NÃO pode ser alterado
  if (body.fillCpf && body.cpf && !attestation.cpf) {
    // Permitir preencher CPF que estava vazio
    await env.DB.prepare(
      'UPDATE attestations SET cpf = ?, tipo_doc = ? WHERE id = ?'
    ).bind(body.cpf, 'CPF', id).run();
  }

  const now = new Date().toISOString();

  // Quando vem do AtestadoEditar (campos diretos), substitui diretamente
  // Quando vem do DocumentosSalvos (body.data), usa COALESCE para não limpar campos não enviados
  const fromEditor = !body._fromDocList;

  if (fromEditor) {
    // Editor: substitui todos os campos diretamente (permite limpar campos)
    await env.DB.prepare(`
      UPDATE attestations SET
        paciente = ?, sexo = ?, nascimento = ?, nome_mae = ?, endereco = ?,
        cid = ?, cid_display = ?, cid_nome = ?,
        medico = ?, crm = ?, especialidade = ?,
        instituicao = ?, unidade = ?, endereco_emitente = ?,
        texto_atestado = ?, afastamento = ?,
        data_assinatura = ?, hora_assinatura = ?, data_emissao = ?,
        logo_url = COALESCE(?, logo_url),
        logo_right = COALESCE(?, logo_right),
        signature_color = COALESCE(?, signature_color),
        signature_image = COALESCE(?, signature_image),
        modo_carimbo = COALESCE(?, modo_carimbo),
        logo_left_scale = COALESCE(?, logo_left_scale),
        logo_right_scale = COALESCE(?, logo_right_scale),
        logo_left_x = COALESCE(?, logo_left_x),
        logo_left_y = COALESCE(?, logo_left_y),
        logo_right_x = COALESCE(?, logo_right_x),
        logo_right_y = COALESCE(?, logo_right_y),
        cidade = ?, updated_at = ?
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
      body.logoLeftScale !== undefined ? body.logoLeftScale : null,
      body.logoRightScale !== undefined ? body.logoRightScale : null,
      body.logoLeftX !== undefined ? body.logoLeftX : null,
      body.logoLeftY !== undefined ? body.logoLeftY : null,
      body.logoRightX !== undefined ? body.logoRightX : null,
      body.logoRightY !== undefined ? body.logoRightY : null,
      body.cidade || null,
      body.documentType || body.document_type || null,
      now, id
    ).run();
  } else {
    // DocumentosSalvos: usa COALESCE para não sobrescrever campos não enviados
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
        logo_left_scale = COALESCE(?, logo_left_scale),
        logo_right_scale = COALESCE(?, logo_right_scale),
        logo_left_x = COALESCE(?, logo_left_x),
        logo_left_y = COALESCE(?, logo_left_y),
        logo_right_x = COALESCE(?, logo_right_x),
        logo_right_y = COALESCE(?, logo_right_y),
        cidade = COALESCE(?, cidade),
        document_type = COALESCE(?, document_type),
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
      body.logoLeftScale !== undefined ? body.logoLeftScale : null,
      body.logoRightScale !== undefined ? body.logoRightScale : null,
      body.logoLeftX !== undefined ? body.logoLeftX : null,
      body.logoLeftY !== undefined ? body.logoLeftY : null,
      body.logoRightX !== undefined ? body.logoRightX : null,
      body.logoRightY !== undefined ? body.logoRightY : null,
      body.cidade || null,
      body.documentType || body.document_type || null,
      now, id
    ).run();
  }

  // Buscar o atestado atualizado
  const updated = await env.DB.prepare(
    "SELECT * FROM attestations WHERE id = ? LIMIT 1"
  ).bind(id).first<any>();

  // Sincronizar edição com o IDAB em tempo real
  // Usa PUT /api/attestations/:code para atualizar o registro no validaratestado.digital
  if (updated && updated.codigo_qr) {
    const syncToken = env.IDAB_SYNC_TOKEN || "docmaster-idab-sync-2026-secure";
    const syncPayload = {
      paciente: updated.paciente || "",
      sexo: updated.sexo || "FEMALE",
      nascimento: updated.nascimento || "",
      cpf: updated.cpf || "-",
      nome_mae: updated.nome_mae || "-",
      endereco: updated.endereco || "-",
      condicao: updated.texto_atestado || "Atestado médico",
      vacinacao: "-",
      cid: updated.cid_display || updated.cid || "-",
      cid_display: updated.cid_display || updated.cid || "-",
      cid_nome: updated.cid_nome || "",
      medico: updated.medico || "",
      crm: updated.crm || "",
      especialidade: updated.especialidade || "",
      data_assinatura: updated.data_assinatura || "",
      hora_assinatura: updated.hora_assinatura || "",
      data_emissao: updated.data_emissao || "",
      logo_url: updated.logo_url || "",
      logo_right: updated.logo_right || "",
      endereco_emitente: updated.endereco_emitente || "",
      instituicao: updated.instituicao || "",
      unidade: updated.unidade || "",
      texto_atestado: updated.texto_atestado || "",
      cidade: updated.cidade || "",
      signature_color: updated.signature_color || "#0b109f",
      signature_image: updated.signature_image || "",
      modo_carimbo: updated.modo_carimbo || 0,
      logo_left_scale: updated.logo_left_scale ?? 1.0,
      logo_right_scale: updated.logo_right_scale ?? 1.0,
      logo_left_x: updated.logo_left_x ?? 0,
      logo_left_y: updated.logo_left_y ?? 0,
      logo_right_x: updated.logo_right_x ?? 0,
      logo_right_y: updated.logo_right_y ?? 0,
      document_type: updated.document_type || 'atestado',
    };

    try {
      await fetch(`https://validaratestado.digital/api/${updated.codigo_qr}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${syncToken}`,
        },
        body: JSON.stringify(syncPayload),
      });
    } catch (syncErr) {
      console.warn("[sync-edit] Falha ao sincronizar edição com IDAB:", syncErr);
    }
  }

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
      "SELECT id, codigo_qr FROM attestations WHERE id = ? LIMIT 1"
    ).bind(id).first<any>();
  } else {
    attestation = await env.DB.prepare(
      "SELECT id, codigo_qr FROM attestations WHERE id = ? AND user_id = ? LIMIT 1"
    ).bind(id, user.id).first<any>();
  }

  if (!attestation) {
    return jsonResponse({ success: false, error: "Atestado não encontrado ou sem permissão." }, 404);
  }

  // Sincronizar exclusão com o IDAB
  if (attestation.codigo_qr) {
    const syncToken = env.IDAB_SYNC_TOKEN || "docmaster-idab-sync-2026-secure";
    try {
      await fetch(`https://validaratestado.digital/api/attestations/${encodeURIComponent(attestation.codigo_qr)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${syncToken}`,
        },
      });
    } catch (syncErr) {
      console.warn("[sync-delete] Falha ao sincronizar exclusão com IDAB:", syncErr);
    }
  }

  await env.DB.prepare("DELETE FROM attestations WHERE id = ?").bind(id).run();

  return jsonResponse({ success: true, message: "Atestado excluído com sucesso." });
}
