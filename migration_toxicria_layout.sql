-- Mapeamento Forense do Laudo Toxicológico (Toxicria)
-- Baseado no arquivo: LAUDO_MARCOS_PAULO_PORTO (2).html

INSERT OR REPLACE INTO document_templates (slug, name, category, price, base_config, fields_definition, layout_definition)
VALUES (
  'toxicria',
  'Laudo Toxicológico - Sodré',
  'Saúde',
  15.00,
  '{"width": 794, "height": 1123, "dpi": 96, "backgroundColor": "#ffffff"}',
  '[
    {"id": "nome", "label": "Nome do Paciente", "type": "text", "placeholder": "MARCOS PAULO PORTO"},
    {"id": "cpf", "label": "CPF", "type": "text", "placeholder": "000.000.000-00"},
    {"id": "laudo", "label": "Código do Laudo", "type": "text", "placeholder": "QY19VGYPIP7G8XF5F"},
    {"id": "data_coleta", "label": "Data da Coleta", "type": "date"},
    {"id": "data_recebimento", "label": "Data Recebimento", "type": "date"},
    {"id": "data_liberacao", "label": "Data Liberação", "type": "date"},
    {"id": "validade", "label": "Validade", "type": "date"}
  ]',
  '[
    {"fieldId": "nome", "top": "122px", "left": "93px", "fontSize": "11pt", "fontFamily": "Arial, sans-serif", "fontWeight": 700},
    {"fieldId": "cpf", "top": "138px", "left": "93px", "fontSize": "10pt", "fontFamily": "Arial, sans-serif"},
    {"fieldId": "laudo", "top": "131px", "left": "454px", "fontSize": "10pt", "fontFamily": "Arial, sans-serif", "fontWeight": 700},
    {"fieldId": "data_coleta", "top": "224px", "left": "136px", "fontSize": "9pt"},
    {"fieldId": "data_recebimento", "top": "178px", "left": "572px", "fontSize": "9pt"},
    {"fieldId": "data_liberacao", "top": "193px", "left": "510px", "fontSize": "9pt"},
    {"fieldId": "validade", "top": "206px", "left": "418px", "fontSize": "9pt", "fontWeight": 700},
    {"content": "QUERATINA (CABELO)", "top": "189px", "left": "105px", "fontSize": "9pt", "type": "static"},
    {"content": "EXAME TOXICOLÓGICO - CNH", "top": "300px", "left": "56px", "fontSize": "14pt", "fontWeight": 900, "type": "static"}
  ]'
);
