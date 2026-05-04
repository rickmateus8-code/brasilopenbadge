-- Migration: Core Universal Engine Tables
-- Data: 04/05/2026

CREATE TABLE IF NOT EXISTS document_templates (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  base_config TEXT NOT NULL, -- JSON
  fields_definition TEXT NOT NULL, -- JSON
  layout_definition TEXT NOT NULL, -- JSON
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserção do Template Petição STJ v3
DELETE FROM document_templates WHERE slug = 'peticao-stj-v3';

INSERT INTO document_templates (slug, name, category, price, base_config, fields_definition, layout_definition)
VALUES (
  'peticao-stj-v3',
  'Petição Judicial STJ (Universal V3)',
  'Judicial',
  20.00,
  '{"width": 826, "height": 1180, "dpi": 300, "backgroundColor": "#ffffff", "watermarkUrl": "/assets/peticao/background_logo.png"}',
  '[
    {"id": "credor", "label": "Credor", "type": "text", "placeholder": "Nome do Credor", "required": true},
    {"id": "cpf_cnpj", "label": "CPF/CNPJ", "type": "text", "placeholder": "000.000.000-00", "required": true},
    {"id": "advogado", "label": "Advogado(a)", "type": "text", "placeholder": "Nome do Advogado", "required": true},
    {"id": "processo", "label": "Número do Processo", "type": "text", "mask": "0000000-00.0000.0.00.0000", "required": true},
    {"id": "contra", "label": "Execução Contra", "type": "text", "placeholder": "Ex: BANCO ITAU", "required": true},
    {"id": "valor", "label": "Valor (R$)", "type": "currency", "required": true},
    {"id": "data", "label": "Data", "type": "date", "required": true}
  ]',
  '[
    {"type": "image", "src": "/assets/peticao/oab_logo.png", "top": "-3px", "left": "5.3px", "width": "134.8px", "zIndex": 11},
    {"type": "image", "src": "/assets/peticao/brasao_republica.png", "top": "30px", "left": "50%", "transform": "translateX(-50%)", "width": "132.4px", "zIndex": 11},
    {"content": "TRIBUNAL DE JUSTIÇA", "top": "166px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "10.1pt", "fontWeight": 400, "textAlign": "center", "width": "100%"},
    {"content": "ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: XXXX/2026", "fieldId": "alvara_final", "top": "184px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "8.4pt", "fontWeight": 400, "textAlign": "center", "width": "100%"},
    {"content": "AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105", "top": "196px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "8.4pt", "fontWeight": 400, "textAlign": "center", "width": "100%"},
    
    {"content": "PROCESSO JUDICIAL ELETRÔNICO", "top": "267px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "16.2pt", "fontWeight": 700, "textAlign": "center", "width": "100%", "transform": "translateX(-50%) scaleX(0.97) scaleY(0.97)"},
    {"content": "Processo Judiciário", "top": "291px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "12.8pt", "fontWeight": 400, "textAlign": "center", "width": "100%"},
    
    {"content": "Credor:", "top": "328.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "credor", "top": "328.2px", "left": "165px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"content": "CPF/CNPJ:", "top": "349.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "cpf_cnpj", "top": "349.2px", "left": "195px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"content": "Advogado(a):", "top": "378.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "advogado", "top": "378.2px", "left": "215px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"content": "Processo N°:", "top": "463.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400},
    {"fieldId": "processo", "top": "463.2px", "left": "215px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"content": "CUMPRIMENTO DE SENTENÇA CONTRA:", "top": "541.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400, "borderBottom": "1px solid #000", "paddingBottom": "2px", "paddingRight": "130px"},
    {"fieldId": "contra", "top": "541.2px", "left": "445px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"content": "Assunto:", "top": "586.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400},
    {"content": "Decisão Favorável", "top": "586.2px", "left": "175px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"content": "Situação:", "top": "611.2px", "left": "97.3px", "fontSize": "13.3pt", "fontWeight": 400},
    {"content": "AUTORIZADO", "top": "611.2px", "left": "185px", "fontSize": "13.3pt", "fontWeight": 400},
    
    {"type": "barcode", "fieldId": "alvara_final", "top": "679.2px", "left": "117.3px", "width": "1.4", "height": "40.2"},
    
    {"content": "Valor a receber: R$ ", "top": "747.4px", "left": "97.3px", "fontSize": "13.1pt", "fontWeight": 400},
    {"fieldId": "valor", "top": "747.4px", "left": "245px", "fontSize": "13.1pt", "fontWeight": 400},
    {"content": " será depositado em conta corrente de sua titularidade..", "top": "747.4px", "left": "350px", "fontSize": "13.1pt", "fontWeight": 400},
    
    {"content": "Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e", "top": "829.4px", "left": "97.3px", "fontSize": "12.8pt", "fontWeight": 400},
    {"content": "posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.", "top": "850.4px", "left": "97.3px", "fontSize": "12.8pt", "fontWeight": 400},
    
    {"fieldId": "data_extenso", "top": "909.4px", "left": "97.3px", "fontSize": "14.0pt", "fontWeight": 400},
    
    {"content": "PODER JUDICIÁRIO", "bottom": "113.6px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "10.8pt", "fontWeight": 400, "textAlign": "center", "width": "100%"},
    {"content": "TJ – Tribunal de Justiça.", "bottom": "95px", "left": "50%", "transform": "translateX(-50%)", "fontSize": "11.8pt", "fontWeight": 400, "textAlign": "center", "width": "100%", "fontStyle": "italic"},
    
    {"type": "image", "src": "/assets/peticao/assinatura_juiz.png", "bottom": "42.6px", "left": "50%", "transform": "translateX(-50%)", "height": "114px", "zIndex": 12}
  ]'
);
