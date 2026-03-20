-- DocMaster - Migração V3
-- Criar tabela attestations e inserir dados iniciais

CREATE TABLE IF NOT EXISTS attestations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'emitido',
  paciente TEXT NOT NULL,
  sexo TEXT,
  nascimento TEXT,
  cpf TEXT,
  cns TEXT,
  tipo_doc TEXT DEFAULT 'CPF',
  nome_mae TEXT,
  endereco TEXT,
  cid TEXT,
  cid_display TEXT,
  cid_nome TEXT,
  medico TEXT NOT NULL,
  crm TEXT NOT NULL,
  especialidade TEXT,
  instituicao TEXT,
  unidade TEXT,
  endereco_emitente TEXT,
  texto_atestado TEXT,
  afastamento TEXT DEFAULT '3',
  data_assinatura TEXT,
  hora_assinatura TEXT,
  data_emissao TEXT,
  cidade TEXT,
  logo_url TEXT,
  logo_right TEXT,
  signature_color TEXT DEFAULT '#0b109f',
  signature_image TEXT,
  modo_carimbo INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices de segurança
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_codigo_qr ON attestations(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Inserir administrador master cyberpiolho
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, balance, is_active)
VALUES (
  '2156addc-f216-4ea5-b5e6-76cf76d7949d',
  'cyberpiolho',
  'admin@docmaster.store',
  '0bd573c29e0c446a61e07b21fbd75bc0d3d13defe1b6e6d615e7bb01c3814c4c',
  'admin',
  999999.0,
  1
);

-- Inserir preços dos documentos (usando estrutura existente da tabela)
INSERT OR IGNORE INTO document_pricing (document_type, display_name, price, is_active)
VALUES
  ('atestado', 'Atestado Médico', 500, 1),
  ('cnh', 'CNH Digital', 1000, 1),
  ('cha', 'CHA Náutica', 1000, 1),
  ('toxicologico', 'Exame Toxicológico', 800, 1),
  ('historico-sp', 'Histórico Escolar SP', 1500, 1),
  ('historico-uninter', 'Histórico UNINTER', 1500, 1);
