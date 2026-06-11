-- Migração V13: Adição de controle de visibilidade da frase de afastamento no Relatório Médico
ALTER TABLE attestations ADD COLUMN hide_afastamento_text INTEGER DEFAULT 0;
