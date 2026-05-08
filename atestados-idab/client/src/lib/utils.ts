import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utilidades Universais do DocMaster
 * Validação CPF, API CEP, formatação de dados
 */

// ─── Validação de CPF ──────────────────────────────────────────────────────────
export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cleaned.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cleaned.charAt(10))) return false;
  return true;
}

// ─── Formatação de CPF ─────────────────────────────────────────────────────────
export function formatarCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

// ─── API CEP (ViaCEP) ──────────────────────────────────────────────────────────
export interface DadosCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function buscarCEP(cep: string): Promise<DadosCEP | null> {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    if (!response.ok) return null;
    const data = await response.json() as DadosCEP;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export function formatarEndereco(
  logradouro: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
  complemento?: string
): string {
  let endereco = `${logradouro}, ${numero}`;
  if (complemento) endereco += ` - ${complemento}`;
  endereco += ` - ${bairro}, ${cidade}/${uf}`;
  return endereco;
}

export function formatarCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

export function formatarRG(rg: string): string {
  return rg.replace(/\./g, '');
}

export function formatarData(data: string): string {
  const cleaned = data.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
}

export function htmlDateToDisplay(htmlDate: string): string {
  if (!htmlDate) return '';
  const parts = htmlDate.split('-');
  if (parts.length !== 3) return htmlDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function displayDateToHtml(displayDate: string): string {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length !== 3) return displayDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
