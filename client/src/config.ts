/**
 * Configurações globais do sistema de atestados
 * 
 * Para alterar o domínio, basta modificar a constante VALIDATION_DOMAIN abaixo.
 * Todos os QR Codes e links de validação serão atualizados automaticamente.
 */

// Domínio base para validação via QR Code (exclusivo para QR Code)
// Domínio definitivo para produção
export const VALIDATION_DOMAIN = "validaratestado.digital";

export const APP_CONFIG = {
  validationDomain: VALIDATION_DOMAIN,

  get validationBaseUrl() {
    return `https://${VALIDATION_DOMAIN}`;
  },

  get validationUrl() {
    return `https://${VALIDATION_DOMAIN}/v`;
  },

  institutionName: "IDAB - DERMATOLOGY AND ALLERGY INSTITUTE",

  apiBaseUrl: "/api",
};
