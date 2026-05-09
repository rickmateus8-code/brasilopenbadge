/**
 * datajud-client.ts — Cliente para integração com a API Pública do Datajud (CNJ)
 * Baseado no tutorial: API Pública do Datajud (beta)
 */

const DATAJUD_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

/**
 * Mapeia o número do processo CNJ para o alias do Tribunal no Datajud.
 * Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function getCourtAlias(processNumber: string): string | null {
  const clean = processNumber.replace(/\D/g, "");
  if (clean.length < 20) return null;

  // Segmento de Justiça (J) e Código do Tribunal (TR)
  // O formato é: NNNNNNN DD AAAA J TR OOOO
  // Exemplos: 5016085 27 2023 8 08 0048
  // J está na posição index 13 (se contarmos do 0)
  // TR está na posição index 14 e 15
  
  const segment = clean.substring(13, 14); // J
  const courtCode = clean.substring(14, 16); // TR

  if (segment === "3") return "api_publica_stj"; // Superior Tribunal de Justiça
  if (segment === "5") return `api_publica_trt${parseInt(courtCode)}`; // Justiça do Trabalho
  if (segment === "4") return `api_publica_trf${parseInt(courtCode)}`; // Justiça Federal
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

  return "api_publica_tjsp"; // Fallback para TJSP se não identificado
}

export async function searchDatajudProcess(processNumber: string) {
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
      query: {
        match: {
          numeroProcesso: cleanNumber
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Datajud (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  const hits = data.hits?.hits || [];
  
  if (hits.length === 0) return null;

  // Retorna o primeiro resultado (maior relevância)
  const source = hits[0]._source;

  // Mapeamento para o formato do nosso Dashboard
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
    documentos: [], // Datajud API Pública não fornece links diretos para PDFs por segurança
    orgao_julgador: source.orgaoJulgador?.nome,
    tribunal: source.tribunal,
    polo_ativo: (source.partes || [])
      .filter((p: any) => p.polo === "AT" || p.polo === "ATIVO")
      .map((p: any) => ({ nome: p.nome, cpf: p.cpf || p.cnpj || "" })),
    polo_passivo: (source.partes || [])
      .filter((p: any) => p.polo === "PA" || p.polo === "PASSIVO")
      .map((p: any) => ({ nome: p.nome, cpf: p.cpf || p.cnpj || "" })),
  };
}
