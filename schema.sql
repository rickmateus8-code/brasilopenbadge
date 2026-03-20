-- DocMaster Database Schema v2
-- Cloudflare D1 (SQLite)
-- Segurança: QR Code gerado exclusivamente no servidor

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Attestations (Atestados Médicos) ─────────────────────────────────────────
-- NOTA: codigo_qr é gerado EXCLUSIVAMENTE no servidor (nunca pelo cliente)
-- O campo status garante que documentos sem confirmação não são válidos
CREATE TABLE IF NOT EXISTS attestations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,          -- Gerado no servidor, nunca pelo cliente
  status TEXT NOT NULL DEFAULT 'emitido'   -- 'emitido' | 'cancelado'
    CHECK (status IN ('emitido', 'cancelado')),

  -- Dados do paciente
  paciente TEXT NOT NULL,
  sexo TEXT,
  nascimento TEXT,
  cpf TEXT,
  cns TEXT,
  tipo_doc TEXT DEFAULT 'CPF',
  nome_mae TEXT,
  endereco TEXT,

  -- Dados médicos
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

  -- Datas e assinatura
  data_assinatura TEXT,
  hora_assinatura TEXT,
  data_emissao TEXT,
  cidade TEXT,

  -- Logos e visual
  logo_url TEXT,
  logo_right TEXT,
  signature_color TEXT DEFAULT '#0b109f',
  signature_image TEXT,
  modo_carimbo INTEGER DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Documents (CNH, CHA, Toxicológico, Históricos) ───────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                      -- 'cnh' | 'cha' | 'toxicologico' | 'historico-sp' | 'historico-uninter'
  data TEXT NOT NULL,                      -- JSON com os dados do documento
  codigo_qr TEXT UNIQUE,                   -- Gerado no servidor, nunca pelo cliente
  status TEXT NOT NULL DEFAULT 'emitido'
    CHECK (status IN ('emitido', 'cancelado')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount REAL NOT NULL,
  description TEXT,
  document_type TEXT,
  document_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Document Pricing ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_pricing (
  document_type TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 5.00,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Índices de Performance e Segurança ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_codigo_qr ON attestations(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON attestations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_codigo_qr ON documents(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ─── Preços Padrão ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO document_pricing (document_type, display_name, price) VALUES
  ('atestado',           'Atestado Médico',       5.00),
  ('cnh',                'CNH Digital',            5.00),
  ('cha',                'CHA Náutica',            5.00),
  ('toxicologico',       'Exame Toxicológico',     5.00),
  ('historico-sp',       'Histórico Escolar SP',   5.00),
  ('historico-uninter',  'Histórico UNINTER',      5.00);
