PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE document_templates (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_config TEXT NOT NULL DEFAULT '{}',    
  fields_definition TEXT NOT NULL DEFAULT '[]', 
  layout_definition TEXT NOT NULL DEFAULT '[]', 
  price REAL NOT NULL DEFAULT 5.00,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "document_templates" VALUES('peticao-stj-v2','Petição Judicial STJ (Universal)','Judicial','{"width": 826, "height": 1180, "dpi": 300, "backgroundColor": "#ffffff", "watermarkUrl": "/assets/peticao/background_logo.png"}',replace(replace('[\r\n    {"id": "credor", "label": "Credor", "type": "text", "placeholder": "Nome do Credor", "required": true},\r\n    {"id": "processo", "label": "Processo", "type": "text", "mask": "0000000-00.0000.0.00.0000", "required": true},\r\n    {"id": "valor", "label": "Valor (R$)", "type": "currency", "required": true}\r\n  ]','\r',char(13)),'\n',char(10)),replace(replace('[\r\n    {"fieldId": "credor", "top": 328, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 400},\r\n    {"fieldId": "processo", "top": 463, "left": 97.3, "fontSize": "13.3pt", "fontWeight": 400},\r\n    {"fieldId": "valor", "top": 747, "left": 97.3, "fontSize": "13.1pt", "fontWeight": 400}\r\n  ]','\r',char(13)),'\n',char(10)),20,1,'2026-05-04 22:14:48','2026-05-04 22:14:48');