import type { Env } from "../types";

/**
 * datajud-engine.ts — API de Engine Judicial (Datajud + Escavador)
 * Suporta o novo Dashboard do Bot Adv via POST.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

/**
 * Mapeamento de Tribunal Alias
 */
function getTribunalAlias(cleanProcesso: string): string | null {
  const segment = cleanProcesso.substring(12, 13);
  const tribunalCode = cleanProcesso.substring(13, 15);

  if (segment === "8") {
    const ufMap: Record<string, string> = {
      "01": "tjac", "02": "tjal", "03": "tjap", "04": "tjam", "05": "tjba", "06": "tjce",
      "07": "tjdft", "08": "tjes", "09": "tjgo", "10": "tjma", "11": "tjmt", "12": "tjms",
      "13": "tjmg", "14": "tjpa", "15": "tjpb", "16": "tjpr", "17": "tjpe", "18": "tjpi",
      "19": "tjrj", "20": "tjrn", "21": "tjrs", "22": "tjro", "23": "tjrr", "24": "tjsc",
      "25": "tjsp", "26": "tjse", "27": "tjto"
    };
    return ufMap[tribunalCode] || "tjsp";
  }
  if (segment === "5") return `trt${parseInt(tribunalCode)}`;
  if (segment === "4") return `trf${parseInt(tribunalCode)}`;
  if (segment === "3") return "stj";
  return null;
}

async function fetchFromDatajud(processo: string) {
  const clean = processo.replace(/\D/g, "");
  if (clean.length !== 20) return null;

  const alias = getTribunalAlias(clean);
  if (!alias) return null;

  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${alias}/_search`;
  const apiKey = "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Authorization": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { match: { numeroProcesso: clean } } })
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const hit = data.hits?.hits?.[0]?._source;
    if (!hit) return null;

    return {
      raw: hit,
      credores: hit.partes?.filter((p: any) => p.tipoPersonagem === "ATIVO").map((p: any) => ({
        nome: p.nome,
        cpf: p.cpfCnpj || ""
      })) || [],
      advogado: "CONSULTE OS AUTOS",
      processo: hit.numeroProcesso,
      parte_contraria: hit.partes?.find((p: any) => p.tipoPersonagem === "PASSIVO")?.nome || "N/A",
      valor: "R$ 0,00",
      classe: hit.classe?.nome || "N/A",
      assunto: hit.assunto?.nome || "N/A",
      orgao_julgador: hit.orgaoJulgador?.nome || "N/A",
      summary: `Processo ${hit.numeroProcesso} localizado no ${hit.orgaoJulgador?.nome}. Classe: ${hit.classe?.nome}.`
    };
  } catch { return null; }
}

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

    const extract = (regex: RegExp) => {
      const m = html.match(regex);
      return m ? m[1].trim() : "";
    };

    const advogado = extract(/Advogado:<\/strong>\s*([^<]+)/i);
    const classe = extract(/Classe:<\/strong>\s*([^<]+)/i);
    const orgao = extract(/Órgão Julgador:<\/strong>\s*([^<]+)/i);
    const valor = extract(/Valor da Ação:<\/strong>\s*([^<]+)/i);

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
      classe: classe || "N/A",
      orgao_julgador: orgao || "N/A",
      summary: `Processo ${processo} localizado via Referência. Órgão: ${orgao || "N/A"}.`
    };
  } catch { return null; }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json() as any;
    const query = body.query;

    if (!query) return new Response(JSON.stringify({ error: "Query is required" }), { status: 400, headers: CORS_HEADERS });

    // 1. Tentar Datajud
    let data = await fetchFromDatajud(query);
    
    // 2. Fallback para Supremo
    if (!data) {
      data = await fetchFromSupremo(query);
    }

    if (data) {
      return new Response(JSON.stringify({ success: true, data }), { headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Processo não encontrado no Datajud ou Referência." 
    }), { status: 404, headers: CORS_HEADERS });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
};
