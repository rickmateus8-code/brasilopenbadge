/**
 * Configurações globais do sistema de atestados
 * 
 * O domínio é detectado dinamicamente baseado em onde o projeto está sendo acessado.
 * Isso permite que os QR Codes funcionem em qualquer ambiente:
 * - Localhost (desenvolvimento)
 * - Link local do Manus (testes)
 * - Cloudflare Workers/Pages (produção)
 * - Domínio personalizado (produção com domínio próprio)
 */

// Função para obter o domínio dinâmico
function getDynamicDomain(): string {
  if (typeof window !== 'undefined') {
    // Usa o domínio de onde o site está sendo acessado
    return window.location.host;
  }
  // Fallback para servidor (SSR)
  return "localhost:3000";
}

// Função para obter o protocolo dinâmico
function getDynamicProtocol(): string {
  if (typeof window !== 'undefined') {
    return window.location.protocol.replace(':', '');
  }
  return 'https';
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

  institutionName: "IDAB - DERMATOLOGY AND ALLERGY INSTITUTE",

  apiBaseUrl: "/api",
};
