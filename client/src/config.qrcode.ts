/**
 * Configuração de QR Code — DocMaster
 * Sistema UNIVERSAL de validação via QR Code.
 *
 * Domínios de validação por tipo de documento:
 * - Atestados:  https://validaratestado.digital/verificar/atestado/:codigo
 * - Receitas:   https://verificamed.digital/verificar/receita/:codigo
 * - CNH:        https://validacao-online-vio.digital/?id=:codigo
 * - Genérico:   https://docmaster.store/v/:codigo
 *
 * REGRA UNIVERSAL: Todo documento com QR Code DEVE usar estas funções.
 * Novos tipos de documento devem ser adicionados ao mapa VALIDATION_DOMAINS.
 */

// ─── Mapa de domínios de validação por tipo de documento ───────────────────────
const VALIDATION_DOMAINS: Record<string, string> = {
  atestado:     "https://validaratestado.digital/verificar/atestado",
  receita:      "https://verificamed.digital/verificar/receita",
  cnh:          "https://validacao-online-vio.digital/?id=",
  cha:          "https://docmaster.store/v",
  toxicologico: "https://docmaster.store/v",
  "historico-sp":      "https://docmaster.store/v",
  "historico-uninter": "https://docmaster.store/v",
};

// ─── Domínio fallback para tipos não mapeados ──────────────────────────────────
const DEFAULT_VALIDATION_DOMAIN = "https://docmaster.store/v";

export const QR_CODE_CONFIG = {
  qrCodeBaseUrl: "https://validaratestado.digital",
  getQRCodeValidationUrl(code: string): string {
    return `${this.qrCodeBaseUrl}/verificar/atestado/${code}`;
  },
  protocol: "https",
};

/**
 * FUNÇÃO UNIVERSAL — Retorna a URL de validação para QUALQUER tipo de documento.
 * Usar esta função para todos os documentos atuais e futuros.
 *
 * @param tipo - Tipo do documento ("atestado", "receita", "cnh", "cha", etc.)
 * @param codigo - Código de validação do documento (formato XXXX.XXXX)
 * @returns URL completa de validação
 */
export function getQRCodeUniversal(tipo: string, codigo: string): string {
  const domain = VALIDATION_DOMAINS[tipo.toLowerCase()] || DEFAULT_VALIDATION_DOMAIN;
  return `${domain}/${codigo}`;
}

/**
 * Retorna a URL completa de validação para um código de atestado.
 */
export function getQRCodeValue(attestationCode: string): string {
  return getQRCodeUniversal("atestado", attestationCode);
}

/**
 * Retorna a URL completa de validação para um código de receita.
 */
export function getQRCodeReceita(codigoReceita: string): string {
  return getQRCodeUniversal("receita", codigoReceita);
}

/**
 * Retorna a URL completa de validação para um código de CNH.
 */
export function getQRCodeCNH(codigoCNH: string): string {
  // CNH usa formato ?id=codigo ao invés de /codigo
  return `https://validacao-online-vio.digital/?id=${codigoCNH}`;
}
