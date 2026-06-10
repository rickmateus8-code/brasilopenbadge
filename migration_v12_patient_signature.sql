-- Migração V12: Adição de controles de visibilidade de assinatura
-- Adiciona hide_signature_line (se não existir) e hide_patient_signature

-- Tenta adicionar a coluna hide_signature_line (caso alguma migração anterior tenha falhado ou sido pulada)
ALTER TABLE attestations ADD COLUMN hide_signature_line INTEGER DEFAULT 0;

-- Adiciona a coluna para ocultar a assinatura do paciente
ALTER TABLE attestations ADD COLUMN hide_patient_signature INTEGER DEFAULT 0;
