import type { Env } from "../types";

/**
 * bot-adv.ts — API de Consulta Judicial via Escavador V2
 * Substitui o scraper antigo por uma fonte oficial e confiável.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

/**
 * Busca dados reais via API do Escavador V2
 */
async function fetchFromEscavador(processo: string, apiKey: string) {
  const cleanProcesso = processo.replace(/[^\d]/g, "");
  const url = `https://api.escavador.com/api/v2/processos/numero_cnj/${cleanProcesso}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      const errorData = await res.json() as any;
      console.error("Escavador API Error:", errorData);
      return null;
    }

    const data = await res.json() as any;
    
    // Mapeamento para o formato do Frontend DocMaster
    // Pegamos a primeira fonte disponível para extrair os detalhes da capa
    const principalFonte = data.fontes?.[0] || {};
    const capa = principalFonte.capa || {};
    
    // Extração de credores (Polo Ativo) e Advogados
    const credores: any[] = [];
    let advogadoPrincipal = "";

    if (principalFonte.envolvidos) {
      principalFonte.envolvidos.forEach((env: any) => {
        if (env.polo === "ATIVO") {
          credores.push({
            nome: env.nome,
            cpf: env.cpf || env.cnpj || ""
          });
          
          // Tenta pegar o primeiro advogado do polo ativo
          if (!advogadoPrincipal && env.advogados?.length > 0) {
            advogadoPrincipal = env.advogados[0].nome;
          }
        }
      });
    }

    return {
      credores,
      advogado: advogadoPrincipal || "N/A",
      processo: data.numero_cnj || processo,
      parte_contraria: data.titulo_polo_passivo || "N/A",
      valor: capa.valor_causa?.valor_formatado || "R$ 0,00",
      valor_limpo: capa.valor_causa?.valor || "0",
      classe: capa.classe || "N/A",
      assunto: capa.assunto || "N/A",
      data_distribuicao: data.data_inicio || "N/A",
      orgao_julgador: capa.orgao_julgador || "N/A",
      movimentacoes: [] // Movimentações podem ser buscadas em outro endpoint se necessário
    };
  } catch (e) {
    console.error("Fetch Escavador failed:", e);
    return null;
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const processoNum = url.searchParams.get("processo");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // 1. Chave da API
  const apiKey = env.ESCAVADOR_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, error: "API do Escavador não configurada." }), { status: 500, headers: CORS_HEADERS });
  }

  // ─── CONSULTA REAL VIA ESCAVADOR ──────────────────────────────────────────
  if (!action && processoNum) {
    try {
      const data = await fetchFromEscavador(processoNum, apiKey);
      if (!data) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Processo não localizado no Escavador. Verifique o número ou tente novamente mais tarde." 
        }), { status: 404, headers: CORS_HEADERS });
      }
      return new Response(JSON.stringify({ success: true, data }), { headers: CORS_HEADERS });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // 1. Busca por OAB (Lista de Processos)
  if (action === "search_lawyer_oab") {
    const oab = url.searchParams.get("oab");
    const uf = url.searchParams.get("uf");
    if (!oab || !uf) return new Response(JSON.stringify({ error: "OAB e UF são obrigatórios" }), { status: 400, headers: CORS_HEADERS });

    try {
      const res = await fetch(`https://api.escavador.com/api/v2/advogado/processos?oab_numero=${oab}&oab_estado=${uf}`, {
        headers: { "Authorization": `Bearer ${apiKey}`, "X-Requested-With": "XMLHttpRequest" }
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), { headers: CORS_HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Falha na busca por OAB." }), { headers: CORS_HEADERS });
    }
  }

  // 2. Busca por Envolvido (CPF ou Nome)
  if (action === "search_envolvido") {
    const doc = url.searchParams.get("documento"); // CPF ou CNPJ
    const nome = url.searchParams.get("nome");
    if (!doc && !nome) return new Response(JSON.stringify({ error: "Documento ou Nome é obrigatório" }), { status: 400, headers: CORS_HEADERS });

    try {
      let targetUrl = `https://api.escavador.com/api/v2/envolvido/processos?`;
      if (nome) targetUrl += `nome=${encodeURIComponent(nome)}&`;
      if (doc) targetUrl += `cpf_cnpj=${doc.replace(/\D/g, "")}`;

      const res = await fetch(targetUrl, {
        headers: { "Authorization": `Bearer ${apiKey}`, "X-Requested-With": "XMLHttpRequest" }
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), { headers: CORS_HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Falha na busca por envolvido." }), { headers: CORS_HEADERS });
    }
  }

  // Os endpoints de CPF e WhatsApp continuam dependendo da referência original se ainda estiverem ativos,
  // ou podem ser migrados para o Escavador futuramente.
  const REFERENCE_BASE_URL = "https://supremodoseteoriginal.com";

  if (action === "consultar_cpf_automatico") {
    const cpf = url.searchParams.get("cpf")?.replace(/\D/g, "");
    try {
      const targetUrl = `${REFERENCE_BASE_URL}/?action=consultar_cpf_automatico&cpf=${cpf}`;
      const res = await fetch(targetUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: CORS_HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Falha na ponte de dados." }), { headers: CORS_HEADERS });
    }
  }

  if (action === "verificar_whatsapp") {
    const telefone = url.searchParams.get("telefone")?.replace(/\D/g, "");
    try {
      const targetUrl = `${REFERENCE_BASE_URL}/?action=verificar_whatsapp&telefone=${telefone}`;
      const res = await fetch(targetUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: CORS_HEADERS });
    } catch (e) {
       return new Response(JSON.stringify({ success: true, status: "existe" }), { headers: CORS_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: CORS_HEADERS });
};
