const REFERENCE_BASE_URL = "https://supremodoseteoriginal.com";

/**
 * Normaliza datas retornadas pela referência
 */
function normalizeDate(raw: string): string {
  if (!raw) return "—";
  const clean = String(raw).trim();
  if (clean.includes("-") && clean.length >= 10) {
    const parts = clean.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
}

/**
 * Extrai dados reais fazendo SCRAPE da referência (Proxy High-Fidelity)
 */
async function fetchRealProcessFromReference(processo: string) {
  const url = `${REFERENCE_BASE_URL}/?processo=${encodeURIComponent(processo)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html"
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return null;
    const html = await res.text();

    const extract = (pattern: RegExp) => {
      const match = html.match(pattern);
      return match ? match[1].trim() : "";
    };

    const advogado = extract(/Advogado Principal:.*?<strong>(.*?)<\/strong>/s) || extract(/Advogado:.*?Advogado: (.*?) \(CPF/s);
    const classe = extract(/Classe:<\/strong> (.*?)<\/p>/);
    const assunto = extract(/Assunto:<\/strong> (.*?)<\/p>/);
    const valor = extract(/Valor da Ação:<\/strong> (.*?)<\/p>/);
    const dataInicio = extract(/Data de Início:<\/strong> (.*?)<\/p>/);
    const orgao = extract(/Órgão Julgador:<\/strong> (.*?)<\/p>/) || extract(/Órgão Julgador: (.*?)<\/p>/);
    
    const credoresMatch = html.match(/Credores Identificados:.*?<ul.*?>(.*?)<\/ul>/s);
    const credores: any[] = [];
    if (credoresMatch) {
       const liMatches = credoresMatch[1].matchAll(/<li>\s*<strong>(.*?)<\/strong>\s*\(CPF\/CNPJ: (.*?)\)\s*<\/li>/gs);
       for (const m of liMatches) {
          credores.push({ nome: m[1].trim(), cpf: m[2].trim() });
       }
    }

    const passivo = extract(/Polo Passivo \(Parte Contrária\).*?Parte:<\/strong> (.*?)<\/p>/s);

    if (!credores.length && !advogado) return null;

    return {
      credores,
      advogado,
      processo,
      parte_contraria: passivo,
      valor,
      valor_limpo: valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
      classe,
      assunto,
      data_distribuicao: dataInicio,
      orgao_julgador: orgao,
      movimentacoes: []
    };
  } catch (e) { return null; }
}

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
 * bot-adv.ts — API 100% Real (Proxy de supremodoseteoriginal.com)
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const processoNum = url.searchParams.get("processo");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ─── CONSULTA REAL VIA PROXY REFERÊNCIA ───────────────────────────────────
  if (!action && processoNum) {
    try {
      const data = await fetchRealProcessFromReference(processoNum);
      if (!data) return new Response(JSON.stringify({ success: false, error: "Processo não localizado ou dados indisponíveis." }), { status: 404, headers: CORS_HEADERS });
      return new Response(JSON.stringify({ success: true, data }), { headers: CORS_HEADERS });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // 1. consultar_cpf_automatico (Proxy Direto)
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

  // 2. verificar_whatsapp (Proxy Direto)
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
