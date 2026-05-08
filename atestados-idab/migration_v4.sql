-- Migração v4: Governança de Dados, Precificação Dinâmica e Retenção
-- Cloudflare D1 (SQLite)

-- 1. Tabela para Precificação e Visibilidade por Usuário
CREATE TABLE IF NOT EXISTS user_document_overrides (
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  price_override REAL,          -- Se NULL, usa o preço global de document_pricing
  is_visible INTEGER DEFAULT 1, -- 0 para ocultar, 1 para mostrar
  retention_days INTEGER,       -- Dias antes da exclusão automática (ex: 3 para STJ)
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, document_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_type) REFERENCES document_pricing(document_type) ON DELETE CASCADE
);

-- 2. Adicionar coluna de expiração nas tabelas de documentos
-- Nota: Usamos blocos separados para evitar erros se a coluna já existir em migrações manuais
ALTER TABLE documents ADD COLUMN expires_at TEXT;
ALTER TABLE attestations ADD COLUMN expires_at TEXT;
ALTER TABLE receitas ADD COLUMN expires_at TEXT;

-- 3. Inserir precificação padrão para Petição STJ se não existir
INSERT OR IGNORE INTO document_pricing (document_type, display_name, price) VALUES
  ('peticao-stj', 'STJ Petição', 20.00);

-- 4. Índices para performance de expiração
CREATE INDEX IF NOT EXISTS idx_documents_expires ON documents(expires_at);
CREATE INDEX IF NOT EXISTS idx_attestations_expires ON attestations(expires_at);
CREATE INDEX IF NOT EXISTS idx_receitas_expires ON receitas(expires_at);
