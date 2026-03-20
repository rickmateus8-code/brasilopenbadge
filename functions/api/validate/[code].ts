/**
 * GET /api/validate/:code
 * Endpoint público de validação de documentos via QR Code.
 *
 * SEGURANÇA:
 * - Apenas documentos com status "emitido" são considerados válidos
 * - O código QR é gerado exclusivamente pelo servidor no momento da emissão
 * - Não há como forjar um código sem acesso ao banco D1
 */

import type { Env } from "../../types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const code = (params.code as string || "").trim().toUpperCase();

  if (!code || code.length < 4) {
    return new Response(
      JSON.stringify({ valid: false, message: "Código inválido." }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    // Busca na tabela attestations (atestados médicos)
    const attestation = await env.DB.prepare(
      `SELECT
        a.id, a.codigo_qr, a.paciente, a.sexo, a.nascimento,
        a.cpf, a.cns, a.tipo_doc, a.nome_mae, a.endereco,
        a.medico, a.crm, a.especialidade, a.cid, a.cid_display, a.cid_nome,
        a.texto_atestado, a.afastamento, a.data_emissao, a.hora_assinatura,
        a.cidade, a.instituicao, a.unidade, a.endereco_emitente,
        a.logo_left, a.logo_right, a.signature_color, a.modo_carimbo,
        a.status, a.created_at,
        u.username as emitido_por
       FROM attestations a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.codigo_qr = ? AND a.status = 'emitido'`
    )
      .bind(code)
      .first<Record<string, unknown>>();

    if (attestation) {
      const data = {
        id: attestation.id,
        tipo: "atestado",
        codigoQR: attestation.codigo_qr,
        paciente: attestation.paciente,
        sexo: attestation.sexo,
        nascimento: attestation.nascimento,
        cpf: attestation.cpf,
        cns: attestation.cns,
        tipoDoc: attestation.tipo_doc,
        nomeMae: attestation.nome_mae,
        endereco: attestation.endereco,
        medico: attestation.medico,
        crm: attestation.crm,
        especialidade: attestation.especialidade,
        cid: attestation.cid,
        cidDisplay: attestation.cid_display,
        cidNome: attestation.cid_nome,
        textoAtestado: attestation.texto_atestado,
        afastamento: attestation.afastamento,
        dataEmissao: attestation.data_emissao,
        dataAssinatura: attestation.data_emissao,
        horaAssinatura: attestation.hora_assinatura,
        cidade: attestation.cidade,
        instituicao: attestation.instituicao,
        unidade: attestation.unidade,
        enderecoEmitente: attestation.endereco_emitente,
        logoUrl: attestation.logo_left,
        logoRight: attestation.logo_right,
        signatureColor: attestation.signature_color,
        modoCarimbo: attestation.modo_carimbo === 1,
        status: attestation.status,
        emitidoPor: attestation.emitido_por,
        createdAt: attestation.created_at,
      };

      return new Response(
        JSON.stringify({ valid: true, message: "Documento válido e autêntico.", data }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Busca na tabela documents (CNH, CHA, Toxicológico, etc.)
    const document = await env.DB.prepare(
      `SELECT
        d.id, d.codigo_validacao, d.type, d.data, d.status, d.created_at,
        u.username as emitido_por
       FROM documents d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.codigo_validacao = ? AND d.status = 'emitido'`
    )
      .bind(code)
      .first<Record<string, unknown>>();

    if (document) {
      let parsedData: Record<string, unknown> = {};
      try {
        parsedData = JSON.parse(document.data as string || "{}");
      } catch {
        // ignore
      }

      return new Response(
        JSON.stringify({
          valid: true,
          message: "Documento válido e autêntico.",
          data: {
            id: document.id,
            tipo: document.type,
            codigoQR: document.codigo_validacao,
            status: document.status,
            emitidoPor: document.emitido_por,
            createdAt: document.created_at,
            ...parsedData,
          },
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ valid: false, message: "Documento não encontrado ou código inválido." }),
      { status: 404, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("[validate] Erro:", err);
    return new Response(
      JSON.stringify({ valid: false, message: "Erro interno ao validar documento." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
