/**
 * Configuração de QR Code — DocMaster
 *
 * Atestados: https://validaratestado.digital/verificar/atestado/:codigo
 * Receitas:  https://verificamed.digital/verificar/receita/:codigo
 */

export const QR_CODE_CONFIG = {
  // Domínio de validação público para atestados
  qrCodeBaseUrl: "https://validaratestado.digital",

  getQRCodeValidationUrl(code: string): string {
    return `${this.qrCodeBaseUrl}/verificar/atestado/${code}`;
  },

  protocol: "https",
};

/**
 * Retorna a URL completa de validação para um código de atestado.
 * Usada para gerar o QR Code no documento.
 */
export function getQRCodeValue(attestationCode: string): string {
  return QR_CODE_CONFIG.getQRCodeValidationUrl(attestationCode);
}

/**
 * Retorna a URL completa de validação para um código de receita.
 * Usada para gerar o QR Code no receituário.
 */
export function getQRCodeReceita(codigoReceita: string): string {
  return `https://verificamed.digital/verificar/receita/${codigoReceita}`;
}
