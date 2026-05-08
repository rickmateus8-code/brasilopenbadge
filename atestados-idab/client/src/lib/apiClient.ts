/**
 * Cliente de API para integração com Cloudflare Pages Functions + D1
 * 
 * Usa a API do backend como fonte primária de dados.
 * Fallback para dados locais em caso de erro de rede.
 */

export interface AttestationApiData {
  id: string;
  codigoQR: string;
  paciente: string;
  sexo: string;
  nascimento: string;
  cpf: string;
  nomeMae: string;
  endereco: string;
  passaporte: string;
  condicao: string;
  vacinacao: string;
  cid: string;
  medico: string;
  crm: string;
  especialidade: string;
  dataAssinatura: string;
  horaAssinatura: string;
  dataEmissao: string;
  logoUrl?: string;
  enderecoEmitente?: string;
  instituicao?: string;
}

export interface CreateAttestationPayload {
  paciente: string;
  sexo: string;
  nascimento: string;
  cpf: string;
  nomeMae: string;
  endereco: string;
  passaporte?: string;
  condicao: string;
  vacinacao: string;
  cid: string;
  medico: string;
  crm: string;
  especialidade: string;
  dataAssinatura: string;
  horaAssinatura: string;
  dataEmissao: string;
  logoUrl?: string;
  enderecoEmitente?: string;
  instituicao?: string;
}

const API_BASE = '/api';

/**
 * Buscar atestado por código de validação via API
 */
export async function fetchAttestationByCode(code: string): Promise<AttestationApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/validate/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const json = await res.json() as { success: boolean; valid: boolean; data?: AttestationApiData };
    if (json.success && json.valid && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('[apiClient] fetchAttestationByCode error:', err);
    return null;
  }
}

/**
 * Validar atestado por código + data via API
 */
export async function validateAttestationApi(
  code: string,
  date?: string
): Promise<{ valid: boolean; data: AttestationApiData | null }> {
  try {
    const url = date
      ? `${API_BASE}/validate/${encodeURIComponent(code)}?date=${encodeURIComponent(date)}`
      : `${API_BASE}/validate/${encodeURIComponent(code)}`;

    const res = await fetch(url);
    if (!res.ok) return { valid: false, data: null };

    const json = await res.json() as { success: boolean; valid: boolean; data?: AttestationApiData };
    if (json.valid && json.data) {
      return { valid: true, data: json.data };
    }
    return { valid: false, data: null };
  } catch (err) {
    console.warn('[apiClient] validateAttestationApi error:', err);
    return { valid: false, data: null };
  }
}

/**
 * Criar novo atestado via API (salva no D1)
 */
export async function createAttestationApi(
  payload: CreateAttestationPayload
): Promise<AttestationApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/attestations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const json = await res.json() as { success: boolean; data?: AttestationApiData };
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('[apiClient] createAttestationApi error:', err);
    throw err;
  }
}

/**
 * Listar todos os atestados via API
 */
export async function fetchAllAttestations(): Promise<AttestationApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/attestations`);
    if (!res.ok) return [];
    const json = await res.json() as { success: boolean; data?: AttestationApiData[] };
    return json.data || [];
  } catch (err) {
    console.warn('[apiClient] fetchAllAttestations error:', err);
    return [];
  }
}
