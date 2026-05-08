/**
 * DocMaster — Camada de acesso a atestados
 *
 * SEGURANÇA: Todos os dados são gerenciados exclusivamente pelo backend (Cloudflare D1).
 * Não há bypass local, localStorage ou dados estáticos.
 * A validação de QR Code só é possível via servidor.
 */

export interface AttestationData {
  id: string;
  paciente: string;
  sexo: string;
  nascimento: string;
  cpf?: string;
  cns?: string;
  tipoDoc?: "CPF" | "CNS";
  nomeMae: string;
  endereco: string;
  cid?: string;
  codigoQR: string;
  dataAssinatura: string;
  horaAssinatura: string;
  medico: string;
  crm: string;
  especialidade: string;
  dataEmissao: string;
  afastamento: string;
  cidade?: string;
  logoUrl?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
  modoCarimbo?: boolean;
  cidDisplay?: string;
  cidNome?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Buscar atestado por código via API do servidor.
 * Retorna null se não encontrado.
 */
export async function findByCode(code: string): Promise<AttestationData | null> {
  try {
    const res = await fetch(`/api/validate/${encodeURIComponent(code)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.id) return null;
    return data as AttestationData;
  } catch {
    return null;
  }
}

/**
 * Validar atestado por código via API do servidor.
 */
export async function validateAttestation(
  code: string
): Promise<{ valid: boolean; message: string; data?: AttestationData }> {
  try {
    const res = await fetch(`/api/validate/${encodeURIComponent(code)}`, {
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok || !json) {
      return { valid: false, message: "Atestado não encontrado." };
    }
    if (json.id) {
      return { valid: true, message: "Atestado válido.", data: json as AttestationData };
    }
    return { valid: false, message: json.error || "Atestado inválido." };
  } catch {
    return { valid: false, message: "Erro ao validar. Tente novamente." };
  }
}

/**
 * Buscar todos os atestados do usuário logado via API.
 */
export async function getAllAttestations(): Promise<AttestationData[]> {
  try {
    const res = await fetch("/api/attestations", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.attestations || data || []) as AttestationData[];
  } catch {
    return [];
  }
}
