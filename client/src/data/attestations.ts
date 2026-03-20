/**
 * DocMaster — Tipos de dados para atestados
 * Dados estáticos removidos por segurança. Todos os dados vêm do backend D1.
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
  cidDisplay?: string;
  cidNome?: string;
  codigoQR: string;
  dataAssinatura: string;
  horaAssinatura: string;
  medico: string;
  crm: string;
  especialidade?: string;
  dataEmissao?: string;
  instituicao?: string;
  unidade?: string;
  enderecoEmitente?: string;
  textoAtestado?: string;
  afastamento?: string;
  cidade?: string;
  logoUrl?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
  modoCarimbo?: boolean;
  status?: string;
  [key: string]: any;
}

// Sem dados estáticos — todos os atestados são gerenciados pelo banco D1
export const attestations: Record<string, AttestationData> = {};
