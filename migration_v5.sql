-- Migration v5: Adicionar suporte a documentos gratuitos por usuário
-- Descrição: Permite que administradores selecionem quais documentos são gratuitos para usuários específicos.

-- Adicionar coluna free_documents na tabela users
ALTER TABLE users ADD COLUMN free_documents TEXT DEFAULT '[]';

-- Atualizar metadados de versão
CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, description TEXT, applied_at TEXT DEFAULT (datetime('now')));
INSERT INTO _migrations (version, description) VALUES (5, 'Adicionar documentos gratuitos por usuário');
