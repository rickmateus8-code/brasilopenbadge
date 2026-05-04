-- Migration: Criação da tabela de templates para o Motor Universal de Documentos
-- Data: 04/05/2026

CREATE TABLE IF NOT EXISTS document_templates (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_config TEXT NOT NULL DEFAULT '{}',    -- JSON: { width, height, dpi, backgroundColor, watermarkUrl }
  fields_definition TEXT NOT NULL DEFAULT '[]', -- JSON: [{ id, label, type, mask, placeholder, required }]
  layout_definition TEXT NOT NULL DEFAULT '[]', -- JSON: [{ fieldId, top, left, fontSize, fontWeight, color, fontFamily }]
  price REAL NOT NULL DEFAULT 5.00,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Template Inicial: Petição Judicial (Exemplo para validação)
INSERT OR IGNORE INTO document_templates (slug, name, category, price, base_config, fields_definition, layout_definition)
VALUES (
  'peticao-stj-v2',
  'Petição Judicial STJ (Universal)',
  'Judicial',
  20.00,
  '{"width": 826, "height": 1180, "dpi": 300, "backgroundColor": "#ffffff", "watermarkUrl": "/assets/peticao/background_logo.png"}',
  '[
    {"id": "credor", "label": "Credor", "type": "text", "placeholder": "Nome do Credor", "required": true},
    {"id": "processo", "label": "Processo", "type": "text", "mask": "0000000-00.0000.0.00.0000", "required": true},
    {"id": "valor", "label": "Valor (R$)", "type": "currency", "required": true}
  ]',
  '[
    {"fieldId": "credor", "top": 328, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "processo", "top": 463, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "valor", "top": 747, "left": 97.3, "fontSize": "13.1pt", "fontWeight": 400}
  ]'
);
