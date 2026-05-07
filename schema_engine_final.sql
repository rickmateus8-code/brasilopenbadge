-- Tabela de Templates (Engine Universal)
CREATE TABLE IF NOT EXISTS document_templates (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 5.00,
  base_config TEXT NOT NULL,         -- JSON: width, height, watermarkUrl
  fields_definition TEXT NOT NULL,   -- JSON: array de campos
  layout_definition TEXT NOT NULL,   -- JSON: array de coordenadas e estilos
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Tabela de Histórico (Rollback de Layout)
CREATE TABLE IF NOT EXISTS document_template_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_slug TEXT NOT NULL,
  layout_definition TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_slug) REFERENCES document_templates(slug)
);
