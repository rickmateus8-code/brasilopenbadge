/**
 * Configurações globais do DocMaster
 *
 * O domínio é detectado dinamicamente baseado em onde o projeto está sendo acessado.
 * Isso permite que os QR Codes funcionem em qualquer ambiente:
 * - Localhost (desenvolvimento)
 * - Cloudflare Pages (testes)
 * - docmaster.store (produção)
 */

function getDynamicDomain(): string {
  if (typeof window !== "undefined") {
    return window.location.host;
  }
  return "docmaster.store";
}

function getDynamicProtocol(): string {
  if (typeof window !== "undefined") {
    return window.location.protocol.replace(":", "");
  }
  return "https";
}

export const APP_CONFIG = {
  get validationDomain() {
    return getDynamicDomain();
  },

  get validationBaseUrl() {
    return `${getDynamicProtocol()}://${getDynamicDomain()}`;
  },

  get validationUrl() {
    return `${getDynamicProtocol()}://${getDynamicDomain()}/v`;
  },

  appName: "DocMaster",

  apiBaseUrl: "/api",
};
