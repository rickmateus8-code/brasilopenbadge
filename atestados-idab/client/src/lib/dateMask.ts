/**
 * Utilitários de máscara de data DD/MM/AAAA
 * As barras "/" são inseridas automaticamente conforme o usuário digita.
 */

/**
 * Aplica máscara de data DD/MM/AAAA ao valor digitado.
 * Remove caracteres não numéricos e insere "/" nas posições corretas.
 */
export function applyDateMask(value: string): string {
  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, "");

  // Limita a 8 dígitos (DDMMAAAA)
  const limited = digits.slice(0, 8);

  // Formata com barras automáticas
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  }
}

/**
 * Converte data no formato DD/MM/AAAA para formato de exibição no atestado.
 * Retorna a data no formato original (DD/MM/AAAA) para uso interno.
 */
export function formatDateForDisplay(date: string): string {
  return date; // mantém DD/MM/AAAA para exibição
}

/**
 * Converte data DD/MM/AAAA para formato por extenso em inglês (ex: MARCH 16, 2026).
 * Usado no campo dataEmissao do atestado.
 */
export function formatDateToEnglish(date: string): string {
  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const parts = date.split("/");
  if (parts.length !== 3) return date;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parts[2];

  if (isNaN(day) || isNaN(month) || month < 1 || month > 12) return date;

  return `${months[month - 1]} ${day}, ${year}`;
}

/**
 * Verifica se a data DD/MM/AAAA é válida.
 */
export function isValidDate(date: string): boolean {
  const parts = date.split("/");
  if (parts.length !== 3 || parts[2].length !== 4) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
}

/**
 * Handler para uso em campos de input com máscara de data.
 * Retorna o valor formatado para atualizar o estado.
 */
export function handleDateInput(rawValue: string): string {
  return applyDateMask(rawValue);
}
