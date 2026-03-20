/**
 * Configuração de QR Code — DocMaster
 *
 * Os QR Codes apontam para: https://docmaster.store/v/:codigo
 * Usa o domínio atual dinamicamente para funcionar em qualquer ambiente.
 */

function getQRDomain(): string {
  if (typeof window !== "undefined") {
    // Em produção usa o domínio atual (docmaster.store)
    // Em dev usa localhost
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}`;
  }
  return "https://docmaster.store";
}

export const QR_CODE_CONFIG = {
  get qrCodeBaseUrl() {
    return getQRDomain();
  },

  getQRCodeValidationUrl(code: string): string {
    return `${this.qrCodeBaseUrl}/v/${code}`;
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
