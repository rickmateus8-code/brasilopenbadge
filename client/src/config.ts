/**
 * Configurações globais do sistema de atestados
 * 
 * Para alterar o domínio, basta modificar a constante DOMAIN abaixo.
 * Todos os QR Codes e links de validação serão atualizados automaticamente.
 */

// Domínio base para validação via QR Code
export const DOMAIN = "validaratestado.digital";

export const APP_CONFIG = {
  validationDomain: DOMAIN,

  get validationBaseUrl() {
    return `https://${DOMAIN}`;
  },

  get validationUrl() {
    return `https://${DOMAIN}/v`;
  },

  institutionName: "IDAB - DERMATOLOGY AND ALLERGY INSTITUTE",

  apiBaseUrl: "/api",
};
