/**
 * Configuração de QR Code — DocMaster
 *
 * Os QR Codes apontam para: https://validaratestado.digital/:codigo
 * O domínio validaratestado.digital é o validador oficial de documentos DocMaster.
 */

export const QR_CODE_CONFIG = {
  // Domínio de validação público
  qrCodeBaseUrl: "https://validaratestado.digital",

  getQRCodeValidationUrl(code: string): string {
    return `${this.qrCodeBaseUrl}/${code}`;
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
