/**
 * Configuração de QR Code com redirecionamento para validaratestado.digital
 * 
 * Este arquivo configura o domínio usado nos QR Codes dos atestados.
 * Os QR Codes apontam para: https://validaratestado.digital/v/:codigo
 */

// Domínio fixo para QR Code (sempre validaratestado.digital em produção)
export const QR_CODE_CONFIG = {
  // Domínio para QR Code (sempre https://validaratestado.digital)
  qrCodeDomain: "validaratestado.digital",
  
  // URL base para validação via QR Code
  get qrCodeBaseUrl() {
    return `https://${this.qrCodeDomain}`;
  },
  
  // URL para validação (com código)
  getQRCodeValidationUrl(code: string): string {
    return `${this.qrCodeBaseUrl}/v/${code}`;
  },
  
  // Configuração de protocolo
  protocol: "https",
};

/**
 * Usar esta configuração quando gerar QR Codes para garantir que
 * todos os QR Codes apontam para validaratestado.digital
 */
export function getQRCodeValue(attestationCode: string): string {
  return QR_CODE_CONFIG.getQRCodeValidationUrl(attestationCode);
}
