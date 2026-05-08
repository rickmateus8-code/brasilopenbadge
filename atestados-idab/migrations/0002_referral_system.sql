-- Sistema de Indicações DocMaster

-- Adicionar colunas de referência na tabela de usuários
ALTER TABLE users ADD COLUMN referred_by TEXT;
ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;

-- Criar índice para busca rápida por código de indicação
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Tabela de comissões de indicações
CREATE TABLE IF NOT EXISTS referral_commissions (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,      -- Quem indicou (recebe a comissão)
  referee_id TEXT NOT NULL,       -- Quem foi indicado (quem fez a recarga)
  transaction_id TEXT NOT NULL,   -- ID da transação de recarga original
  amount REAL NOT NULL,           -- Valor da comissão (ex: 10% da recarga)
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referee ON referral_commissions(referee_id);

-- Configurações globais do sistema de indicações
CREATE TABLE IF NOT EXISTS referral_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inserir configuração padrão de 10% de comissão
INSERT OR IGNORE INTO referral_settings (key, value, description) 
VALUES ('referral_percent', '10', 'Percentual de comissão para o indicador');
