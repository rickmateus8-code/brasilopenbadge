-- Migração V2: Adicionar novas colunas à tabela attestations e criar tabelas novas

-- Adicionar colunas que podem estar faltando na tabela attestations
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS codigo_qr TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'emitido';
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS sexo TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS nascimento TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS cns TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS tipo_doc TEXT DEFAULT 'CPF';
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS nome_mae TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS cid TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS cid_display TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS cid_nome TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS especialidade TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS instituicao TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS endereco_emitente TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS texto_atestado TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS afastamento TEXT DEFAULT '3';
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS hora_assinatura TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS data_emissao TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS logo_right TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS signature_color TEXT DEFAULT '#0b109f';
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS signature_image TEXT;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS modo_carimbo INTEGER DEFAULT 0;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT (datetime('now'));

-- Criar tabela de usuários se não existir
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  balance REAL NOT NULL DEFAULT 0.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Criar tabela de sessões se não existir
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Criar tabela de transações se não existir
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  document_id TEXT,
  document_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Criar tabela de preços se não existir
CREATE TABLE IF NOT EXISTS document_pricing (
  id TEXT PRIMARY KEY,
  doc_type TEXT UNIQUE NOT NULL,
  price REAL NOT NULL DEFAULT 0.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inserir preços padrão
INSERT OR IGNORE INTO document_pricing (id, doc_type, price) VALUES
  ('price-atestado', 'atestado', 5.00),
  ('price-cnh', 'cnh', 10.00),
  ('price-cha', 'cha', 10.00),
  ('price-toxicologico', 'toxicologico', 8.00),
  ('price-historico-sp', 'historico-sp', 15.00),
  ('price-historico-uninter', 'historico-uninter', 15.00);

-- Criar índices de segurança
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_codigo_qr ON attestations(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
