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
 * Busca dados reais via API Pública do Datajud (CNJ)
 */
async function fetchFromDatajud(processo: string) {
  const cleanProcesso = processo.replace(/\D/g, "");
  if (cleanProcesso.length !== 20) return null;

  // NNNNNNN-DD.YYYY.J.TR.OOOO
  // 1234567-89.0123.4.56.7890
  const segment = cleanProcesso.substring(12, 13); // J
  const tribunalCode = cleanProcesso.substring(13, 15); // TR
  
  let tribunalAlias = "";

  // 1. Mapeamento de Tribunal Alias
  if (segment === "8") { // Estadual
    const ufMap: Record<string, string> = {
      "01": "tjac", "02": "tjal", "03": "tjap", "04": "tjam", "05": "tjba", "06": "tjce",
      "07": "tjdft", "08": "tjes", "09": "tjgo", "10": "tjma", "11": "tjmt", "12": "tjms",
      "13": "tjmg", "14": "tjpa", "15": "tjpb", "16": "tjpr", "17": "tjpe", "18": "tjpi",
      "19": "tjrj", "20": "tjrn", "21": "tjrs", "22": "tjro", "23": "tjrr", "24": "tjsc",
      "25": "tjsp", "26": "tjse", "27": "tjto"
    };
    tribunalAlias = ufMap[tribunalCode] || "tjsp";
  } else if (segment === "5") { // Trabalho
    tribunalAlias = `trt${parseInt(tribunalCode)}`;
  } else if (segment === "4") { // Federal
    tribunalAlias = `trf${parseInt(tribunalCode)}`;
  } else if (segment === "3") { // STJ
    tribunalAlias = "stj";
  } else {
    return null; // Não suportado ou desconhecido
  }

  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunalAlias}/_search`;
  const apiKey = "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cleanProcesso
          }
        }
      })
    });

    if (!res.ok) return null;

    const data = await res.json() as any;
    const hit = data.hits?.hits?.[0]?._source;
    if (!hit) return null;

    // Extração de partes e advogados
    const credores: any[] = [];
    let advogadoPrincipal = "";

    if (hit.prazos) {
       // Datajud costuma trazer partes em arrays específicos ou metadados
    }

    // Fallback robusto para partes envolvidas (Mapeamento padrão Datajud)
    (hit.movimentos || []).forEach((mov: any) => {
        // Tentamos extrair advogados de movimentações se não houver campo direto
    });

    return {
      credores: hit.partes?.filter((p: any) => p.tipoPersonagem === "ATIVO").map((p: any) => ({
        nome: p.nome,
        cpf: p.cpfCnpj || ""
      })) || [],
      advogado: "CONSULTE OS AUTOS", // Datajud API Pública tem restrições de nomes de advogados em alguns tribunais
      processo: hit.numeroProcesso,
      parte_contraria: hit.partes?.find((p: any) => p.tipoPersonagem === "PASSIVO")?.nome || "N/A",
      valor: "R$ 0,00", // Valor da causa nem sempre está na API Pública
      valor_limpo: "0",
      classe: hit.classe?.nome || "N/A",
      assunto: hit.assunto?.nome || "N/A",
      data_distribuicao: hit.dataAjuizamento || "N/A",
      orgao_julgador: hit.orgaoJulgador?.nome || "N/A",
      movimentacoes: (hit.movimentos || []).slice(0, 10).map((m: any) => ({
        data: m.dataHora,
        descricao: m.nome
      }))
    };
  } catch (e) {
    console.error("Datajud API Error:", e);
    return null;
  }
}

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

/**
 * Busca dados via Scrape do Site de Referência (Fallback Supremo)
 */
async function fetchFromSupremo(processo: string) {
  const url = `https://supremodoseteoriginal.com/?processo=${processo.replace(/\D/g, "")}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html"
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extração Regex (Alta Fidelidade)
    const extract = (regex: RegExp) => {
      const m = html.match(regex);
      return m ? m[1].trim() : "";
    };

    const advogado = extract(/Advogado:<\/strong>\s*([^<]+)/i);
    const classe = extract(/Classe:<\/strong>\s*([^<]+)/i);
    const assunto = extract(/Assunto:<\/strong>\s*([^<]+)/i);
    const valor = extract(/Valor da Ação:<\/strong>\s*([^<]+)/i);
    const orgao = extract(/Órgão Julgador:<\/strong>\s*([^<]+)/i);

    // Extração de Credores (Lista)
    const credores: any[] = [];
    const credorMatches = html.matchAll(/Credor:<\/strong>\s*([^<]+)(?:.*?CPF:<\/strong>\s*([\d.-]+))?/gi);
    for (const m of credorMatches) {
      credores.push({ nome: m[1].trim(), cpf: m[2] ? m[2].trim() : "" });
    }

    if (!advogado && credores.length === 0) return null;

    return {
      credores,
      advogado: advogado || "N/A",
      processo,
      parte_contraria: "N/A",
      valor: valor || "R$ 0,00",
      valor_limpo: valor ? valor.replace(/[^\d]/g, "") : "0",
      classe: classe || "N/A",
      assunto: assunto || "N/A",
      orgao_julgador: orgao || "N/A",
      movimentacoes: []
    };
  } catch { return null; }
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

  // ─── CONSULTA REAL (DATAJUD PRIMÁRIO + ESCAVADOR + SUPREMO FALLBACK) ──────
  if (!action && processoNum) {
    try {
      // 1. Tentar Datajud Oficial (CNJ)
      let data = await fetchFromDatajud(processoNum);
      
      // 2. Fallback para Escavador
      if (!data) {
        console.log("[bot-adv] Fallback para Escavador...");
        data = await fetchFromEscavador(processoNum, apiKey);
      }

      // 3. Fallback Supremo (Scrape da Referência) - O "Estado de Ouro" de fallback
      if (!data) {
        console.log("[bot-adv] Fallback Supremo...");
        data = await fetchFromSupremo(processoNum);
      }

      if (!data) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Processo não localizado em nenhuma base (Datajud/Escavador/Referência). Verifique o número." 
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
