/**
 * Type definitions for Attestations API
 */

export interface AttestationRecord {
  id: string;
  codigo_validacao: string;
  paciente: string;
  sexo: 'MALE' | 'FEMALE';
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

export interface AttestationFrontend {
  id: string;
  codigoQR: string;
  paciente: string;
  sexo: 'MALE' | 'FEMALE';
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
  enderecoEmitente: string;
  instituicao: string;
}

export interface CreateAttestationInput {
  paciente: string;
  sexo: 'MALE' | 'FEMALE';
  nascimento: string;
  cpf: string;
  nome_mae: string;
  endereco: string;
  passaporte?: string | null;
  condicao: string;
  vacinacao: string;
  cid: string;
  medico: string;
  crm: string;
  especialidade: string;
  data_assinatura: string;
  hora_assinatura: string;
  data_emissao: string;
  logo_url?: string | null;
  endereco_emitente?: string;
  instituicao?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface ValidateResponse {
  success: boolean;
  valid: boolean;
  message: string;
  data?: AttestationFrontend;
}

export interface Env {
  DB: D1Database;
  ENVIRONMENT: 'production' | 'staging' | 'development';
  HYPERPIX_SECRET_KEY?: string;
  APP_DOMAIN?: string;
  VALIDATION_BASE_URL?: string;
  IDAB_SYNC_TOKEN?: string; // Token de autenticação para sincronização com o Atestados-IDAB
}

// D1 Database type
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = any> {
  success: boolean;
  results?: T[];
  meta?: {
    duration: number;
    last_row_id: number;
    changes: number;
    served_by: string;
    internal_stats: string;
  };
}

export interface D1ExecResult {
  success: boolean;
  results: D1Result[];
}
