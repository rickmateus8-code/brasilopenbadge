-- Tabela de Cache Híbrido para Consultas CNA OAB
CREATE TABLE IF NOT EXISTS oab_cache (
  id TEXT PRIMARY KEY,           -- ID único (ex: "OAB-SP-123456")
  oab TEXT NOT NULL,
  uf TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo_inscricao TEXT,
  situacao TEXT,
  data_inscricao TEXT,
  foto_r2_url TEXT,              -- URL da foto armazenada no R2
  json_data TEXT,                -- Payload completo original
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_oab_uf ON oab_cache(oab, uf);
CREATE INDEX IF NOT EXISTS idx_oab_nome ON oab_cache(nome);
