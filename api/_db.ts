/**
 * In-memory database for Vercel Serverless Functions
 * Uses a static in-memory store with seed data.
 * For production persistence, integrate Vercel KV, Vercel Postgres, or Supabase.
 */

export interface AttestationRecord {
  id: string;
  codigo_validacao: string;
  paciente: string;
  sexo: "MALE" | "FEMALE";
  nascimento: string;
  cpf: string;
  nome_mae: string;
  endereco: string;
  passaporte: string | null;
  condicao: string;
  vacinacao: string;
  cid: string;
  medico: string;
  crm: string;
  especialidade: string;
  data_assinatura: string;
  hora_assinatura: string;
  data_emissao: string;
  logo_url: string | null;
  endereco_emitente: string;
  instituicao: string;
  created_at: string;
  updated_at: string;
}

// ===== SEED DATA =====
const SEED_DATA: AttestationRecord[] = [
  {
    id: "P792.GL02",
    codigo_validacao: "P792.GL02",
    paciente: "LUCAS MESSIAS MARON",
    sexo: "MALE",
    nascimento: "07/10/1987",
    cpf: "033.548.725-43",
    nome_mae: "DIANE MESSIAS MARON",
    endereco: "RUA DE ITABORAHY, 749 AP 103, AMARALINA - SALVADOR - BA, 41900-000",
    passaporte: "GN406067",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    data_assinatura: "16/03/2026",
    hora_assinatura: "15:41",
    data_emissao: "MARCH 16, 2026",
    logo_url: null,
    endereco_emitente: "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    instituicao: "IDAB - SALVADOR/BAHIA",
    created_at: "2026-03-16T15:41:00Z",
    updated_at: "2026-03-16T15:41:00Z",
  },
  {
    id: "UMS4.9Z40",
    codigo_validacao: "UMS4.9Z40",
    paciente: "THIELSILY MONIQUE CÂNDIDA DA SILVA PEREIRA",
    sexo: "FEMALE",
    nascimento: "01/11/1994",
    cpf: "167.709.317-02",
    nome_mae: "CRISTIANA CANDIDA DA SILVA",
    endereco: "RUA CASTELO BRANCO, 290 - CENTRO, ITABORAI/RJ - 24800-089",
    passaporte: "FX255093",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    data_assinatura: "16/03/2026",
    hora_assinatura: "14:53",
    data_emissao: "MARCH 16, 2026",
    logo_url: null,
    endereco_emitente: "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    instituicao: "IDAB - SALVADOR/BAHIA",
    created_at: "2026-03-16T14:53:00Z",
    updated_at: "2026-03-16T14:53:00Z",
  },
];

// In-memory store (resets on cold start, but seed data always present)
let attestations: AttestationRecord[] = [...SEED_DATA];

// ===== VALIDATION CODE GENERATOR =====
function generateValidationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 4; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}.${part2}`;
}

function getUniqueValidationCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = generateValidationCode();
    if (!attestations.find((a) => a.codigo_validacao === code)) break;
    attempts++;
  } while (attempts < 100);
  return code;
}

// ===== DATABASE OPERATIONS =====

export function getAllAttestations(): AttestationRecord[] {
  return [...attestations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getAttestationById(id: string): AttestationRecord | undefined {
  return attestations.find((a) => a.id === id);
}

export function getAttestationByCode(code: string): AttestationRecord | undefined {
  return attestations.find((a) => a.codigo_validacao === code.trim().toUpperCase());
}

export function validateAttestation(
  code: string,
  date: string
): { valid: boolean; attestation?: AttestationRecord } {
  const attestation = getAttestationByCode(code);
  if (!attestation) return { valid: false };
  if (date === attestation.data_assinatura) {
    return { valid: true, attestation };
  }
  return { valid: false };
}

export function createAttestation(
  data: Omit<AttestationRecord, "id" | "codigo_validacao" | "created_at" | "updated_at">
): AttestationRecord {
  const code = getUniqueValidationCode();
  const now = new Date().toISOString();
  const record: AttestationRecord = {
    ...data,
    id: code,
    codigo_validacao: code,
    passaporte: data.passaporte || null,
    logo_url: data.logo_url || null,
    endereco_emitente:
      data.endereco_emitente ||
      "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    instituicao: data.instituicao || "IDAB - SALVADOR/BAHIA",
    created_at: now,
    updated_at: now,
  };
  attestations.push(record);
  return record;
}

export function updateAttestation(
  id: string,
  data: Partial<AttestationRecord>
): AttestationRecord | undefined {
  const index = attestations.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  attestations[index] = {
    ...attestations[index],
    ...data,
    id: attestations[index].id,
    codigo_validacao: attestations[index].codigo_validacao,
    created_at: attestations[index].created_at,
    updated_at: new Date().toISOString(),
  };
  return attestations[index];
}

export function deleteAttestation(id: string): boolean {
  const index = attestations.findIndex((a) => a.id === id);
  if (index === -1) return false;
  attestations.splice(index, 1);
  return true;
}

// ===== MAP TO FRONTEND =====
export function mapToFrontend(record: AttestationRecord) {
  return {
    id: record.id,
    codigoQR: record.codigo_validacao,
    paciente: record.paciente,
    sexo: record.sexo,
    nascimento: record.nascimento,
    cpf: record.cpf,
    nomeMae: record.nome_mae,
    endereco: record.endereco,
    passaporte: record.passaporte || "",
    condicao: record.condicao,
    vacinacao: record.vacinacao,
    cid: record.cid,
    medico: record.medico,
    crm: record.crm,
    especialidade: record.especialidade,
    dataAssinatura: record.data_assinatura,
    horaAssinatura: record.hora_assinatura,
    dataEmissao: record.data_emissao,
    logoUrl: record.logo_url || undefined,
    enderecoEmitente: record.endereco_emitente,
    instituicao: record.instituicao,
  };
}
