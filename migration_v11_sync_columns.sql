-- migration_v11_sync_columns.sql
-- Adiciona suporte a escalas e posições de logos para paridade forense total
-- E campo para identificação de tipo de documento na tabela attestations.

-- Cloudflare D1 (SQLite)
ALTER TABLE attestations ADD COLUMN logo_left_scale REAL DEFAULT 1.0;
ALTER TABLE attestations ADD COLUMN logo_right_scale REAL DEFAULT 1.0;
ALTER TABLE attestations ADD COLUMN logo_left_x REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN logo_left_y REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN logo_right_x REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN logo_right_y REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN document_type TEXT DEFAULT 'atestado';

-- Atualizar versão da migração
CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, description TEXT, applied_at TEXT DEFAULT (datetime('now')));
INSERT OR IGNORE INTO _migrations (version, description) VALUES (11, 'Colunas de escala de logo e tipo de documento');
