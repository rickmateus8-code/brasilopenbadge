import { searchDatajudProcess } from "./judicial/datajud-client";

interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/**
 * bot-adv.ts — API Real integrada com Datajud (CNJ)
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const processoNum = url.searchParams.get("processo");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ─── CONSULTA REAL DATAJUD ────────────────────────────────────────────────
  if (!action && processoNum) {
    try {
      const judicialData = await searchDatajudProcess(processoNum);
      
      if (!judicialData) {
        return new Response(JSON.stringify({ success: false, error: "Processo não encontrado na Base Nacional (Datajud)." }), { status: 404, headers: CORS_HEADERS });
      }

      // Mapeamento estrito para o Dashboard 100% Clone
      const responseData = {
        credores: judicialData.polo_ativo?.length > 0 ? judicialData.polo_ativo : [
          {
            nome: "CONSULTE CPF PARA IDENTIFICAR",
            cpf: "",
          }
        ],
        advogado: judicialData.advogado || "",
        processo: judicialData.processo,
        parte_contraria: judicialData.polo_passivo?.[0]?.nome || "NÃO IDENTIFICADO",
        valor: `R$ ${judicialData.valor_numerico?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        valor_limpo: judicialData.valor_numerico?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        valor_numerico: judicialData.valor_numerico,
        movimentacoes: judicialData.movimentacoes,
        classe: judicialData.classe,
        assunto: judicialData.assunto,
        data_distribuicao: judicialData.data_distribuicao,
        tribunal: judicialData.tribunal
      };

      return new Response(JSON.stringify({ success: true, data: responseData }), { headers: CORS_HEADERS });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // 1. consultar_cpf_automatico (Clone Logic)
  if (action === "consultar_cpf_automatico") {
    const cpf = url.searchParams.get("cpf")?.replace(/\D/g, "");
    if (!cpf || cpf.length !== 11) {
      return new Response(JSON.stringify({ success: false, error: "CPF inválido" }), { headers: CORS_HEADERS });
    }

    // Mock/Snoop Integration for phones
    return new Response(JSON.stringify({
      success: true,
      telefones: ["(27) 9****-**48", "(27) 3****-**00"],
      NOME: "DADOS PROTEGIDOS - REQUER SNOOP API",
    }), { headers: CORS_HEADERS });
  }

  // 2. verificar_whatsapp
  if (action === "verificar_whatsapp") {
    return new Response(JSON.stringify({ success: true, status: "existe" }), { headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: CORS_HEADERS });
};
