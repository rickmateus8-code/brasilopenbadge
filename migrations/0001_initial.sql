-- Create attestations table
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
  instituicao TEXT DEFAULT 'IDAB - SALVADOR/BAHIA',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_codigo_validacao ON attestations(codigo_validacao);
CREATE INDEX IF NOT EXISTS idx_paciente ON attestations(paciente);
CREATE INDEX IF NOT EXISTS idx_cpf ON attestations(cpf);
CREATE INDEX IF NOT EXISTS idx_created_at ON attestations(created_at DESC);

-- Seed initial data
INSERT INTO attestations (
  id, codigo_validacao, paciente, sexo, nascimento, cpf, nome_mae, endereco,
  passaporte, condicao, vacinacao, cid, medico, crm, especialidade,
  data_assinatura, hora_assinatura, data_emissao, logo_url, endereco_emitente, instituicao
) VALUES
(
  'P792.GL02', 'P792.GL02', 'LUCAS MESSIAS MARON', 'MALE', '07/10/1987', '033.548.725-43',
  'DIANE MESSIAS MARON', 'RUA DE ITABORAHY, 749 AP 103, AMARALINA - SALVADOR - BA, 41900-000',
  'GN406067', 'The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.',
  'YELLOW FEVER', 'T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)', 'DIMITRI GUSMAO FLORES',
  'CRM/BA 14180', 'ALLERGY AND IMMUNOLOGY', '16/03/2026', '15:41', 'MARCH 16, 2026', NULL,
  'AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000', 'IDAB - SALVADOR/BAHIA'
),
(
  'UMS4.9Z40', 'UMS4.9Z40', 'THIELSILY MONIQUE CÂNDIDA DA SILVA PEREIRA', 'FEMALE', '01/11/1994', '167.709.317-02',
  'CRISTIANA CANDIDA DA SILVA', 'RUA CASTELO BRANCO, 290 - CENTRO, ITABORAI/RJ - 24800-089',
  'FX255093', 'The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.',
  'YELLOW FEVER', 'T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)', 'DIMITRI GUSMAO FLORES',
  'CRM/BA 14180', 'ALLERGY AND IMMUNOLOGY', '16/03/2026', '14:53', 'MARCH 16, 2026', NULL,
  'AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000', 'IDAB - SALVADOR/BAHIA'
);
