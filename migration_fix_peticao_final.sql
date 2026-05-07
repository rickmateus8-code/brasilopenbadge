-- Garantia de Integridade: PeticaoCria na Engine
INSERT OR REPLACE INTO document_templates (slug, name, category, price, base_config, fields_definition, layout_definition, is_active)
VALUES (
  'peticaocria',
  'Petição Judicial STJ',
  'Judicial',
  2000,
  '{"width": 826, "height": 1180, "dpi": 300, "backgroundColor": "#ffffff", "watermarkUrl": "/assets/peticao/background_logo.png"}',
  '[
    {"id": "credor", "label": "Credor", "type": "text", "required": true},
    {"id": "cpf_cnpj", "label": "CPF/CNPJ", "type": "text", "required": true},
    {"id": "advogado", "label": "Advogado", "type": "text", "required": true},
    {"id": "processo", "label": "Processo", "type": "text", "required": true},
    {"id": "contra", "label": "Contra", "type": "text", "required": true},
    {"id": "valor", "label": "Valor", "type": "text", "required": true},
    {"id": "data", "label": "Data", "type": "text", "required": true}
  ]',
  '[
    {"fieldId": "credor", "top": 328, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 700},
    {"fieldId": "cpf_cnpj", "top": 355, "left": 97.3, "fontSize": "13.3pt"},
    {"fieldId": "advogado", "top": 382, "left": 97.3, "fontSize": "13.3pt"},
    {"fieldId": "processo", "top": 463, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "contra", "top": 540, "left": 97.3, "fontSize": "13.3pt"},
    {"fieldId": "valor", "top": 747, "left": 97.3, "fontSize": "13.1pt"}
  ]',
  1
);
