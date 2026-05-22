-- Migration V12 - Emission Models Management
CREATE TABLE IF NOT EXISTS emission_models (
  id TEXT PRIMARY KEY,
  doc_key TEXT UNIQUE,
  doc_name TEXT,
  images TEXT, -- JSON array of base64
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed with initial models if empty
INSERT OR IGNORE INTO emission_models (id, doc_key, doc_name, images) VALUES
  ('model-atestado', 'atestado', 'ÁREA MÉDICA', '[]'),
  ('model-cnh', 'cnh', 'CNH DIGITAL', '[]'),
  ('model-cha', 'cha', 'CHA NÁUTICA', '[]'),
  ('model-rg', 'rg', 'RG', '[]'),
  ('model-toxicologico', 'toxicologico', 'TOXICOLÓGICO', '[]'),
  ('model-historico', 'historico', 'HISTÓRICO', '[]'),
  ('model-receita', 'receita', 'RECEITUÁRIO', '[]');
