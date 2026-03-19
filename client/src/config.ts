/**
 * Configurações globais do sistema de atestados
 */

// Domínio base para validação via QR Code
// Alterado para o novo domínio solicitado
export const APP_CONFIG = {
  // Novo domínio
  validationDomain: "validaratestado.digital",
  
  // URL base completa (usada para gerar os QR Codes)
  get validationBaseUrl() {
    return `https://${this.validationDomain}`;
  },

  // URLs de validação
  get validationUrl() {
    return `https://${this.validationDomain}/v`;
  },

  // Nome da instituição
  institutionName: "IDAB - DERMATOLOGY AND ALLERGY INSTITUTE",
  
  // Configurações de API
  apiBaseUrl: "/api"
};
