-- DocMaster Database Schema
-- Cloudflare D1 (SQLite)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Attestations table (existing, kept for compatibility)
CREATE TABLE IF NOT EXISTS attestations (
  id TEXT PRIMARY KEY,
  codigo_validacao TEXT UNIQUE NOT NULL,
  user_id TEXT,
  paciente TEXT NOT NULL,
  sexo TEXT,
  nascimento TEXT,
  cpf TEXT,
  nome_mae TEXT,
  endereco TEXT,
  passaporte TEXT,
  condicao TEXT,
  vacinacao TEXT,
  cid TEXT,
  medico TEXT,
  crm TEXT,
  especialidade TEXT,
  data_assinatura TEXT,
  hora_assinatura TEXT,
  data_emissao TEXT,
  logo_url TEXT,
  endereco_emitente TEXT,
  instituicao TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Generic documents table (CNH, CHA, Toxicológico, Históricos)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  codigo_validacao TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount INTEGER NOT NULL,
  description TEXT,
  document_type TEXT,
  document_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Document pricing table
CREATE TABLE IF NOT EXISTS document_pricing (
  document_type TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 500,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attestations_codigo ON attestations(codigo_validacao);
CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_codigo ON documents(codigo_validacao);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Default document pricing
INSERT OR IGNORE INTO document_pricing (document_type, display_name, price) VALUES
  ('atestado', 'Atestado Médico', 500),
  ('cnh', 'CNH Digital', 500),
  ('cha', 'CHA Náutica', 500),
  ('toxicologico', 'Exame Toxicológico', 500),
  ('historico-sp', 'Histórico Escolar SP', 500),
  ('historico-uninter', 'Histórico UNINTER', 500);
