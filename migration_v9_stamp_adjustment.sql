-- migration_v9_stamp_adjustment.sql
-- Adiciona suporte a ajuste fino do Modo Carimbo (Escala, Posição, Rotação)
-- E opção de ocultar QR Code para paridade total com documentos físicos.

-- Cloudflare D1 (SQLite)
ALTER TABLE attestations ADD COLUMN stamp_scale REAL DEFAULT 1.0;
ALTER TABLE attestations ADD COLUMN stamp_x REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN stamp_y REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN stamp_rotate REAL DEFAULT 0;
ALTER TABLE attestations ADD COLUMN hide_qr_code INTEGER DEFAULT 0;

-- Atualizar versão da migração se a tabela existir
CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, description TEXT, applied_at TEXT DEFAULT (datetime('now')));
INSERT INTO _migrations (version, description) VALUES (9, 'Ajuste fino do Modo Carimbo e Ocultar QR Code');
