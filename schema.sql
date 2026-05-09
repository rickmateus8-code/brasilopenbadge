-- DocMaster Database Schema v3
-- Cloudflare D1 (SQLite)
-- Segurança: QR Code gerado exclusivamente no servidor
-- Suporte: Atestados, Receitas, CNH, CHA, Toxicológico, Históricos

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
-- pdf_data armazena o PDF em base64 para download direto a qualquer momento
CREATE TABLE IF NOT EXISTS attestations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,          -- Gerado no servidor, nunca pelo cliente
  validation_url TEXT,                     -- URL completa de validação (verificamed.digital/verificar/atestado/XXXX-XXXX)
  status TEXT NOT NULL DEFAULT 'emitido'   -- 'emitido' | 'cancelado'
    CHECK (status IN ('emitido', 'cancelado')),

  -- Dados do paciente
  paciente TEXT NOT NULL,
  sexo TEXT,
  nascimento TEXT,
  cpf TEXT,                                -- Removido da edição pós-emissão por segurança
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

  -- Armazenamento do PDF gerado (base64) para download direto
  pdf_data TEXT,                           -- PDF em base64, armazenado na emissão
  pdf_generated_at TEXT,                   -- Quando o PDF foi gerado

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Receitas Médicas ─────────────────────────────────────────────────────────
-- Receituário Simples, Controle Especial e Antimicrobiano
CREATE TABLE IF NOT EXISTS receitas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,          -- Formato: RX-XXXX-XXXX
  validation_url TEXT,                     -- verificamed.digital/verificar/receita/RX-XXXX-XXXX
  status TEXT NOT NULL DEFAULT 'emitido'
    CHECK (status IN ('emitido', 'cancelado')),

  -- Tipo de receituário
  tipo_receituario TEXT NOT NULL DEFAULT 'simples'
    CHECK (tipo_receituario IN ('simples', 'controle_especial', 'antimicrobiano')),

  -- Dados do paciente
  paciente TEXT NOT NULL,
  cpf TEXT,
  identidade TEXT,
  endereco TEXT,
  telefone TEXT,
  cidade TEXT,

  -- Dados médicos
  medico TEXT NOT NULL,
  crm TEXT NOT NULL,
  especialidade TEXT,
  instituicao TEXT,
  endereco_emitente TEXT,
  cnpj_emitente TEXT,
  telefone_emitente TEXT,
  site_emitente TEXT,

  -- Prescrição (JSON array de itens)
  -- Cada item: { numero, uso_interno, medicamento, quantidade, modo_uso }
  prescricao TEXT NOT NULL DEFAULT '[]',

  -- Datas
  data_emissao TEXT,
  hora_emissao TEXT,

  -- Logos e visual
  logo_url TEXT,
  signature_color TEXT DEFAULT '#0b109f',
  signature_image TEXT,

  -- Armazenamento do PDF gerado
  pdf_data TEXT,
  pdf_generated_at TEXT,

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
  validation_url TEXT,                     -- verificamed.digital/verificar/{type}/{codigo}
  status TEXT NOT NULL DEFAULT 'emitido'
    CHECK (status IN ('emitido', 'cancelado')),
  pdf_data TEXT,                           -- PDF em base64 para download direto
  pdf_generated_at TEXT,
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
  price REAL NOT NULL DEFAULT 5.00,        -- Armazenado em REAIS (ex: 5.00 = R$ 5,00)
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Admin Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,                    -- 'update_pricing' | 'delete_user' | 'edit_attestation' | etc
  target_type TEXT,                        -- 'user' | 'attestation' | 'receita' | 'pricing'
  target_id TEXT,
  details TEXT,                            -- JSON com detalhes da ação
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Índices de Performance e Segurança ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_codigo_qr ON attestations(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON attestations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_receitas_codigo_qr ON receitas(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_receitas_user_id ON receitas(user_id);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_codigo_qr ON documents(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

-- ─── Preços Padrão ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO document_pricing (document_type, display_name, price) VALUES
  ('atestado',           'Atestado Médico',       5.00),
  ('receita',            'Receita Médica',         5.00),
  ('cnh',                'CNH Digital',            5.00),
  ('cha',                'CHA Náutica',            5.00),
  ('toxicologico',       'Exame Toxicológico',     5.00),
  ('historico-sp',       'Histórico Escolar SP',   5.00),
  ('historico-uninter',  'Histórico UNINTER',      5.00);

-- ─── Medicos Brasil (Migrado do Supabase) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicos_brasil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_medico TEXT NOT NULL,
  crm TEXT NOT NULL,
  uf_crm TEXT NOT NULL,
  especialidade TEXT,
  cod_cbo TEXT,
  cod_cnes TEXT,
  local_trabalho TEXT,
  cidade TEXT,
  uf_local TEXT,
  endereco TEXT,
  bairro TEXT,
  telefone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para busca rápida de médicos
CREATE INDEX IF NOT EXISTS idx_medicos_nome ON medicos_brasil(nome_medico);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON medicos_brasil(crm);
CREATE INDEX IF NOT EXISTS idx_medicos_uf_local ON medicos_brasil(uf_local);
CREATE INDEX IF NOT EXISTS idx_medicos_cidade ON medicos_brasil(cidade);
