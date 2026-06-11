-- DocMaster - Schema Completo V2
-- Banco: docmaster-db

-- Tabela de usuários
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

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de atestados
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
  logo_left_scale REAL DEFAULT 1.0,
  logo_right_scale REAL DEFAULT 1.0,
  logo_left_x REAL DEFAULT 0,
  logo_left_y REAL DEFAULT 0,
  logo_right_x REAL DEFAULT 0,
  logo_right_y REAL DEFAULT 0,
  stamp_scale REAL DEFAULT 1.20,
  stamp_x REAL DEFAULT 141,
  stamp_y REAL DEFAULT -120,
  stamp_rotate REAL DEFAULT -3,
  show_stamp_info INTEGER DEFAULT 1,
  hide_qr_code INTEGER DEFAULT 0,
  hide_signature_line INTEGER DEFAULT 0,
  hide_patient_signature INTEGER DEFAULT 0,
  hide_afastamento_text INTEGER DEFAULT 0,
  document_type TEXT DEFAULT 'atestado',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de transações financeiras
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

-- Tabela de preços de documentos
CREATE TABLE IF NOT EXISTS document_pricing (
  id TEXT PRIMARY KEY,
  doc_type TEXT UNIQUE NOT NULL,
  price REAL NOT NULL DEFAULT 0.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices de segurança e performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_codigo_qr ON attestations(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Preços padrão dos documentos
INSERT OR IGNORE INTO document_pricing (id, doc_type, price) VALUES
  ('price-atestado', 'atestado', 5.00),
  ('price-cnh', 'cnh', 10.00),
  ('price-cha', 'cha', 10.00),
  ('price-toxicologico', 'toxicologico', 8.00),
  ('price-historico-sp', 'historico-sp', 15.00),
  ('price-historico-uninter', 'historico-uninter', 15.00);
