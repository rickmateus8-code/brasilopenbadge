-- migration_v10_stamp_customization.sql
-- Adiciona suporte a visibilidade de dados no Modo Carimbo Elite v3

-- Cloudflare D1 (SQLite)
ALTER TABLE attestations ADD COLUMN show_stamp_info INTEGER DEFAULT 1;

-- Atualizar versão da migração
CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, description TEXT, applied_at TEXT DEFAULT (datetime('now')));
INSERT OR IGNORE INTO _migrations (version, description) VALUES (10, 'Customização de visibilidade do Modo Carimbo');
