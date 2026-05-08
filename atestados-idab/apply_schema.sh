#!/bin/bash
# Script para aplicar o schema DocMaster no banco D1 via MCP
DB_ID="532fb211-af97-44e9-b679-5c061d0cba02"

echo "Criando tabela users..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT, display_name TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', balance INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))\"}" 2>&1 | head -5

echo "Criando tabela sessions..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))\"}" 2>&1 | head -5

echo "Criando tabela documents..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL, codigo_validacao TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')))\"}" 2>&1 | head -5

echo "Criando tabela transactions..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL, description TEXT, document_type TEXT, document_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))\"}" 2>&1 | head -5

echo "Criando tabela document_pricing..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS document_pricing (document_type TEXT PRIMARY KEY, display_name TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 500, is_active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT (datetime('now')))\"}" 2>&1 | head -5

echo "Inserindo preços padrão..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"INSERT OR IGNORE INTO document_pricing (document_type, display_name, price) VALUES ('atestado', 'Atestado Médico', 500), ('cnh', 'CNH Digital', 500), ('cha', 'CHA Náutica', 500), ('toxicologico', 'Exame Toxicológico', 500), ('historico-sp', 'Histórico Escolar SP', 500), ('historico-uninter', 'Histórico UNINTER', 500)\"}" 2>&1 | head -5

echo "Criando índices..."
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)\"}" 2>&1 | head -3
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)\"}" 2>&1 | head -3
manus-mcp-cli tool call d1_database_query --server cloudflare --input "{\"database_id\": \"$DB_ID\", \"sql\": \"CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)\"}" 2>&1 | head -3

echo "Schema aplicado com sucesso!"
