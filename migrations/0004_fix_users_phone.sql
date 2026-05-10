-- Adicionar colunas faltantes na tabela de usuários para compatibilidade com APIs externas (PIX/Snoop)
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN cpf TEXT;

-- Criar índice para busca rápida por CPF
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
