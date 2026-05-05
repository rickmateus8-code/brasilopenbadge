export function isValidCpf(cpf: string | null): boolean {
  if (!cpf) return true; // Opcional se não fornecido
  const cleaned = cpf.replace(/[^\d]/g, '');
  return cleaned.length === 11;
}

export function isValidCrm(crm: string | null): boolean {
  if (!crm) return true;
  return /^\d{2,10}$/.test(crm);
}

export function isValidCid(cid: string | null): boolean {
  if (!cid || cid === "-") return true;
  return /^[A-Z][0-9]{2}(\.[0-9]{0,2})?$/.test(cid.toUpperCase());
}
