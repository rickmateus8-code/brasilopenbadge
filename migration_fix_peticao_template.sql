-- Migration: Garantir template da Petição Universal e Ativação
-- Data: 05/05/2026

INSERT OR REPLACE INTO document_templates (slug, name, category, price, base_config, fields_definition, layout_definition, is_active)
VALUES (
  'peticao-stj-v2',
  'Petição Judicial STJ',
  'Judicial',
  20.00,
  '{"width": 826, "height": 1180, "dpi": 300, "backgroundColor": "#ffffff", "watermarkUrl": "/assets/peticao/background_logo.png"}',
  '[
    {"id": "credor", "label": "Credor", "type": "text", "placeholder": "Nome do Credor", "required": true},
    {"id": "processo", "label": "Processo", "type": "text", "mask": "0000000-00.0000.0.00.0000", "required": true},
    {"id": "valor", "label": "Valor (R$)", "type": "currency", "required": true},
    {"id": "advogado", "label": "Advogado", "type": "text", "required": true}
  ]',
  '[
    {"fieldId": "credor", "top": 328, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 700},
    {"fieldId": "processo", "top": 463, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "valor", "top": 747, "left": 97.3, "fontSize": "13.1pt", "fontWeight": 400},
    {"fieldId": "advogado", "top": 900, "left": 97.3, "fontSize": "14pt", "type": "signature"}
  ]',
  1
);
