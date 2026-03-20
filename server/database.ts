import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - stored in project root/data directory
const DB_DIR = path.resolve(__dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "attestations.db");

// Ensure data directory exists
import fs from "fs";
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS attestations (
    id TEXT PRIMARY KEY,
    codigo_validacao TEXT UNIQUE NOT NULL,
    paciente TEXT NOT NULL,
    sexo TEXT NOT NULL CHECK(sexo IN ('MALE', 'FEMALE')),
    nascimento TEXT NOT NULL,
    cpf TEXT NOT NULL,
    nome_mae TEXT NOT NULL,
    endereco TEXT NOT NULL,
    passaporte TEXT,
    condicao TEXT NOT NULL,
    vacinacao TEXT NOT NULL,
    cid TEXT NOT NULL,
    medico TEXT NOT NULL,
    crm TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    data_assinatura TEXT NOT NULL,
    hora_assinatura TEXT NOT NULL,
    data_emissao TEXT NOT NULL,
    logo_url TEXT,
    endereco_emitente TEXT DEFAULT 'AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000',
    instituicao TEXT DEFAULT 'Clínica / Hospital',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_codigo_validacao ON attestations(codigo_validacao);
  CREATE INDEX IF NOT EXISTS idx_paciente ON attestations(paciente);
  CREATE INDEX IF NOT EXISTS idx_cpf ON attestations(cpf);
`);

// ===== INTERFACES =====

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

// ===== VALIDATION CODE GENERATOR =====

function generateValidationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1Length = 4;
  const part2Length = 4;

  let part1 = "";
  let part2 = "";

  for (let i = 0; i < part1Length; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < part2Length; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${part1}.${part2}`;
}

function getUniqueValidationCode(): string {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM attestations WHERE codigo_validacao = ?");
  let code: string;
  let attempts = 0;

  do {
    code = generateValidationCode();
    const result = stmt.get(code) as { count: number };
    if (result.count === 0) break;
    attempts++;
  } while (attempts < 100);

  return code;
}

// ===== DATABASE OPERATIONS =====

// INSERT
const insertStmt = db.prepare(`
  INSERT INTO attestations (
    id, codigo_validacao, paciente, sexo, nascimento, cpf, nome_mae, endereco,
    passaporte, condicao, vacinacao, cid, medico, crm, especialidade,
    data_assinatura, hora_assinatura, data_emissao, logo_url, endereco_emitente, instituicao
  ) VALUES (
    @id, @codigo_validacao, @paciente, @sexo, @nascimento, @cpf, @nome_mae, @endereco,
    @passaporte, @condicao, @vacinacao, @cid, @medico, @crm, @especialidade,
    @data_assinatura, @hora_assinatura, @data_emissao, @logo_url, @endereco_emitente, @instituicao
  )
`);

export function createAttestation(data: Omit<AttestationRecord, "id" | "codigo_validacao" | "created_at" | "updated_at">): AttestationRecord {
  const id = getUniqueValidationCode();
  const codigo_validacao = id;

  const record = {
    ...data,
    id,
    codigo_validacao,
    passaporte: data.passaporte || null,
    logo_url: data.logo_url || null,
    endereco_emitente: data.endereco_emitente || "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    instituicao: data.instituicao || "Clínica / Hospital",
  };

  insertStmt.run(record);

  return getAttestationById(id)!;
}

// INSERT with specific code (for seeding)
const insertWithCodeStmt = db.prepare(`
  INSERT OR IGNORE INTO attestations (
    id, codigo_validacao, paciente, sexo, nascimento, cpf, nome_mae, endereco,
    passaporte, condicao, vacinacao, cid, medico, crm, especialidade,
    data_assinatura, hora_assinatura, data_emissao, logo_url, endereco_emitente, instituicao
  ) VALUES (
    @id, @codigo_validacao, @paciente, @sexo, @nascimento, @cpf, @nome_mae, @endereco,
    @passaporte, @condicao, @vacinacao, @cid, @medico, @crm, @especialidade,
    @data_assinatura, @hora_assinatura, @data_emissao, @logo_url, @endereco_emitente, @instituicao
  )
`);

export function seedAttestation(data: Omit<AttestationRecord, "created_at" | "updated_at">): void {
  insertWithCodeStmt.run({
    ...data,
    passaporte: data.passaporte || null,
    logo_url: data.logo_url || null,
    endereco_emitente: data.endereco_emitente || "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
    instituicao: data.instituicao || "Clínica / Hospital",
  });
}

// SELECT by ID
const selectByIdStmt = db.prepare("SELECT * FROM attestations WHERE id = ?");
export function getAttestationById(id: string): AttestationRecord | undefined {
  return selectByIdStmt.get(id) as AttestationRecord | undefined;
}

// SELECT by validation code
const selectByCodeStmt = db.prepare("SELECT * FROM attestations WHERE codigo_validacao = ?");
export function getAttestationByCode(code: string): AttestationRecord | undefined {
  return selectByCodeStmt.get(code) as AttestationRecord | undefined;
}

// VALIDATE - check code + date
export function validateAttestation(code: string, date: string): { valid: boolean; attestation?: AttestationRecord } {
  const attestation = getAttestationByCode(code.trim().toUpperCase());
  if (!attestation) {
    return { valid: false };
  }

  // Check if date matches (compare data_assinatura)
  if (date === attestation.data_assinatura) {
    return { valid: true, attestation };
  }

  return { valid: false };
}

// SELECT ALL
const selectAllStmt = db.prepare("SELECT * FROM attestations ORDER BY created_at DESC");
export function getAllAttestations(): AttestationRecord[] {
  return selectAllStmt.all() as AttestationRecord[];
}

// UPDATE
export function updateAttestation(id: string, data: Partial<AttestationRecord>): AttestationRecord | undefined {
  const existing = getAttestationById(id);
  if (!existing) return undefined;

  const fields = Object.keys(data)
    .filter((k) => k !== "id" && k !== "codigo_validacao" && k !== "created_at")
    .map((k) => `${k} = @${k}`)
    .join(", ");

  if (!fields) return existing;

  const updateStmt = db.prepare(`UPDATE attestations SET ${fields}, updated_at = datetime('now') WHERE id = @id`);
  updateStmt.run({ ...data, id });

  return getAttestationById(id);
}

// DELETE
const deleteStmt = db.prepare("DELETE FROM attestations WHERE id = ?");
export function deleteAttestation(id: string): boolean {
  const result = deleteStmt.run(id);
  return result.changes > 0;
}

// COUNT
const countStmt = db.prepare("SELECT COUNT(*) as count FROM attestations");
export function getAttestationCount(): number {
  return (countStmt.get() as { count: number }).count;
}

// ===== SEED DATA =====

export function seedInitialData() {
  if (getAttestationCount() > 0) return;

  seedAttestation({
    id: "P792.GL02",
    codigo_validacao: "P792.GL02",
    paciente: "",
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
    instituicao: "Clínica / Hospital",
  });

  seedAttestation({
    id: "UMS4.9Z40",
    codigo_validacao: "UMS4.9Z40",
    paciente: "",
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
    instituicao: "Clínica / Hospital",
  });

  console.log("✓ Database seeded with 2 initial attestations");
}

export default db;
