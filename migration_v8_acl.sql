-- Migration: Adicionar coluna de permissões granulares para controle de acesso do Admin
-- Data: 05/05/2026

ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '{"editaveis": ["atestado", "cnh", "cha", "toxicologico", "receita"], "ferramentas": ["bot-adv", "peticao-stj"]}';
