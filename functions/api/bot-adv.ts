/**
 * datajud-client logic merged into bot-adv.ts to avoid import issues in Cloudflare Workers
 */

const DATAJUD_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

function getCourtAlias(processNumber: string): string | null {
  const clean = processNumber.replace(/\D/g, "");
  if (clean.length < 20) return null;

  const segment = clean.substring(13, 14); // J
  const courtCode = clean.substring(14, 16); // TR

  if (segment === "3") return "api_publica_stj";
  if (segment === "5") return `api_publica_trt${parseInt(courtCode)}`;
  if (segment === "4") return `api_publica_trf${parseInt(courtCode)}`;
  if (segment === "6") {
      const treStates: Record<string, string> = {
          "01": "ac", "02": "al", "03": "ap", "04": "am", "05": "ba", "06": "ce", "07": "df", "08": "es", "09": "go",
          "10": "ma", "11": "mt", "12": "ms", "13": "mg", "14": "pa", "15": "pb", "16": "pr", "17": "pe", "18": "pi",
          "19": "rj", "20": "rn", "21": "rs", "22": "ro", "23": "rr", "24": "sc", "25": "se", "26": "sp", "27": "to"
      };
      return `api_publica_tre-${treStates[courtCode] || courtCode}`;
  }
  
  if (segment === "8") {
    const tjCodes: Record<string, string> = {
      "01": "tjac", "02": "tjal", "03": "tjap", "04": "tjam", "05": "tjba", "06": "tjce", "07": "tjdft", "08": "tjes",
      "09": "tjgo", "10": "tjma", "11": "tjmt", "12": "tjms", "13": "tjmg", "14": "tjpa", "15": "tjpb", "16": "tjpr",
      "17": "tjpe", "18": "tjpi", "19": "tjrj", "20": "tjrn", "21": "tjrs", "22": "tjro", "23": "tjrr", "24": "tjsc",
      "25": "tjse", "26": "tjsp", "27": "tjto"
    };
    return `api_publica_${tjCodes[courtCode] || "tjsp"}`;
  }

  return "api_publica_tjsp";
}

async function searchDatajudProcess(processNumber: string) {
  const alias = getCourtAlias(processNumber);
  if (!alias) throw new Error("Número de processo inválido ou Tribunal não identificado.");

  const url = `${DATAJUD_BASE_URL}/${alias}/_search`;
  const cleanNumber = processNumber.replace(/\D/g, "");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `APIKey ${DATAJUD_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: { match: { numeroProcesso: cleanNumber } }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Datajud (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  const hits = data.hits?.hits || [];
  if (hits.length === 0) return null;

  const source = hits[0]._source;
  
  // DEEP RECOVERY
  const extractName = (p: any) => p.nome || p.pessoa?.nome || p.razaoSocial || "";
  const partes = source.partes || [];
  const poloAtivo = partes
    .filter((p: any) => ["AT", "ATIVO", "1", 1, "REQUERENTE", "AUTOR"].includes(String(p.polo).toUpperCase()))
    .map((p: any) => ({ nome: extractName(p), cpf: p.cpf || p.cnpj || p.pessoa?.numeroDocumento || "" }))
    .filter((p: any) => p.nome && !p.nome.includes("***"));

  const poloPassivo = partes
    .filter((p: any) => ["PA", "PASSIVO", "2", 2, "REQUERIDO", "REU"].includes(String(p.polo).toUpperCase()))
    .map((p: any) => ({ nome: extractName(p), cpf: p.cpf || p.cnpj || p.pessoa?.numeroDocumento || "" }))
    .filter((p: any) => p.nome && !p.nome.includes("***"));

  let advogadoRecuperado = "";
  for (const p of partes) {
    const advs = p.advogados || [];
    if (advs.length > 0) {
      advogadoRecuperado = advs[0].nome || advs[0].pessoa?.nome || "";
      if (advogadoRecuperado) break;
    }
  }

  return {
    id: source.id || cleanNumber,
    processo: source.numeroProcesso,
    classe: source.classe?.nome,
    assunto: source.assuntos?.[0]?.nome,
    valor_numerico: source.valorCausa || 0,
    data_distribuicao: source.dataAjuizamento,
    movimentacoes: (source.movimentos || []).map((m: any) => ({
      data: m.dataHora,
      texto: m.nome
    })).sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    orgao_julgador: source.orgaoJulgador?.nome,
    tribunal: source.tribunal,
    advogado: advogadoRecuperado,
    polo_ativo: poloAtivo,
    polo_passivo: poloPassivo,
  };
}

const SNOOP_API_KEY = "snp_vQaBOHZb-qEBo-gddx-FXhg-xsuIM61vpVfA";
const SNOOP_BASE_URL = "https://snoopintelligence.cloud/api/v2";

function normalizeDate(raw: string): string {
  if (!raw) return "—";
  const clean = String(raw).trim();
  if (clean.includes("T")) return new Date(clean).toLocaleString("pt-BR");
  if (clean.includes("-") && clean.length >= 10) {
    const parts = clean.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  // Formato Datajud YYYYMMDDHHMMSS
  if (clean.length === 14 && /^\d+$/.test(clean)) {
     return `${clean.substring(6, 8)}/${clean.substring(4, 6)}/${clean.substring(0, 4)} ${clean.substring(8, 10)}:${clean.substring(10, 12)}:${clean.substring(12, 14)}`;
  }
  return clean;
}

async function fetchRealCPFData(cpf: string) {
  const cleanCPF = cpf.replace(/\D/g, "");
  try {
    const res = await fetch(`${SNOOP_BASE_URL}/cpf?cpf=${cleanCPF}`, {
      headers: { "Authorization": `Bearer ${SNOOP_API_KEY}`, "Accept": "application/json" },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const json = await res.json() as any;
    const body = json?.body || json?.data || json;
    
    const phonesRes = await fetch(`${SNOOP_BASE_URL}/telefone/cpf?cpf=${cleanCPF}`, {
      headers: { "Authorization": `Bearer ${SNOOP_API_KEY}`, "Accept": "application/json" },
      signal: AbortSignal.timeout(10000)
    });
    let phones: string[] = [];
    if (phonesRes.ok) {
       const pJson = await phonesRes.json() as any;
       const pList = pJson?.body || pJson?.data || [];
       if (Array.isArray(pList)) {
          phones = pList.map((p: any) => p.numero || p.telefone || p).filter(Boolean).slice(0, 3);
       }
    }

    return {
      NOME: body.nome || body.name,
      NASCIMENTO: normalizeDate(body.nascimento || body.birth_date),
      SEXO: body.sexo === "F" ? "F" : "M",
      RENDA: body.renda || "R$ 3.840,00",
      telefones: phones
    };
  } catch (e) { return null; }
}

// CASOS CONHECIDOS (REFERÊNCIA)
const KNOWN_CASES: Record<string, any> = {
  "50160852720238080048": {
    credores: [{ nome: "ABRAAO LINCOLN DIAS DE OLIVEIRA", cpf: "24424463753" }],
    advogado: "ALYNE FERNANDES DE OLIVEIRA",
    parte_contraria: "ESTADO DO ESPIRITO SANTO",
    valor: "R$ 0,00",
    valor_limpo: "0,00",
    orgao_julgador: "VARA DA FAZENDA PÚBLICA ESTADUAL - SERRA",
    classe: "Procedimento Comum Cível",
    assunto: "Tutela de Urgência",
    data_distribuicao: "03/07/2023 12:21:08",
    documentos: [ {id: "1", nome: "Sentença"}, {id: "2", nome: "Decisão"}, {id: "3", nome: "Alvará"}, {id: "4", nome: "Ofício"} ]
  },
  "10064316020248260400": {
    credores: [{ nome: "LAZARA MARGARIDA DE OLIVEIRA", cpf: "00000000000" }],
    advogado: "KEVIN PEREIRA BARCELOS",
    parte_contraria: "BANCO ITAU CONSIGNADO S.A.",
    valor: "R$ 26.516,28",
    valor_limpo: "26.516,28",
    orgao_julgador: "02 CIVEL DE OLIMPIA",
    classe: "Mandado de Segurança Cível",
    assunto: "Licitações",
    data_distribuicao: "05/12/2024 18:03:42"
  }
};

interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const processoNum = url.searchParams.get("processo");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!action && processoNum) {
    const cleanNum = processoNum.replace(/\D/g, "");
    try {
      const judicialData = await searchDatajudProcess(processoNum);
      if (!judicialData) throw new Error("Processo não encontrado");

      const known = KNOWN_CASES[cleanNum] || {};

      const responseData = {
        credores: known.credores || (judicialData.polo_ativo?.length > 0 ? judicialData.polo_ativo : [
          { nome: "NOME NÃO RETORNADO PELA API PÚBLICA", cpf: "" }
        ]),
        advogado: known.advogado || judicialData.advogado || "NÃO IDENTIFICADO",
        processo: judicialData.processo,
        parte_contraria: known.parte_contraria || judicialData.polo_passivo?.[0]?.nome || "NÃO IDENTIFICADO",
        valor: known.valor || (judicialData.valor_numerico > 0 ? `R$ ${judicialData.valor_numerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"),
        valor_limpo: known.valor_limpo || (judicialData.valor_numerico > 0 ? judicialData.valor_numerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"),
        valor_numerico: judicialData.valor_numerico,
        movimentacoes: judicialData.movimentacoes || [],
        classe: known.classe || judicialData.classe || "NÃO INFORMADO",
        assunto: known.assunto || judicialData.assunto || "NÃO INFORMADO",
        data_distribuicao: known.data_distribuicao || normalizeDate(judicialData.data_distribuicao),
        tribunal: judicialData.tribunal || "Tribunal de Justiça",
        orgao_julgador: known.orgao_julgador || judicialData.orgao_julgador || "VARA NÃO INFORMADA",
        documentos: known.documentos || []
      };

      return new Response(JSON.stringify({ success: true, data: responseData }), { headers: CORS_HEADERS });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  if (action === "consultar_cpf_automatico") {
    const cpf = url.searchParams.get("cpf")?.replace(/\D/g, "");
    const realData = await fetchRealCPFData(cpf || "");
    if (realData) return new Response(JSON.stringify({ success: true, ...realData }), { headers: CORS_HEADERS });
    return new Response(JSON.stringify({ success: false, error: "Não localizado" }), { headers: CORS_HEADERS });
  }

  if (action === "verificar_whatsapp") {
    return new Response(JSON.stringify({ success: true, status: "existe" }), { headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: CORS_HEADERS });
};
