# Schema do Banco D1 - Atestados IDAB

## Informações do Banco

| Propriedade | Valor |
|---|---|
| **Nome** | `atestados-idab` |
| **ID** | `532fb211-af97-44e9-b679-5c061d0cba02` |
| **Binding** | `DB` |
| **Tipo** | Cloudflare D1 (SQLite) |

## Tabela: `attestations`

```sql
CREATE TABLE IF NOT EXISTS attestations (
  id                TEXT PRIMARY KEY,
  codigo_validacao  TEXT UNIQUE NOT NULL,
  paciente          TEXT NOT NULL,
  sexo              TEXT NOT NULL DEFAULT 'MALE',
  nascimento        TEXT NOT NULL,
  cpf               TEXT,
  nome_mae          TEXT,
  endereco          TEXT,
  passaporte        TEXT,
  condicao          TEXT,
  vacinacao         TEXT,
  cid               TEXT,
  medico            TEXT,
  crm               TEXT,
  especialidade     TEXT,
  data_assinatura   TEXT,
  hora_assinatura   TEXT,
  data_emissao      TEXT,
  logo_url          TEXT,
  endereco_emitente TEXT,
  instituicao       TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_codigo ON attestations(codigo_validacao);
CREATE INDEX IF NOT EXISTS idx_paciente ON attestations(paciente);
CREATE INDEX IF NOT EXISTS idx_created ON attestations(created_at);
```

## Notas sobre Campos

- `id` e `codigo_validacao` são iguais (ex: `P792.GL02`) — gerados automaticamente no backend
- `data_assinatura` e `nascimento` armazenados como `DD/MM/AAAA`
- `data_emissao` armazenada por extenso em inglês (ex: `MARCH 16, 2026`)
- `hora_assinatura` armazenada como `HH:MM`
- `sexo` aceita `MALE` ou `FEMALE`

## Consultas Úteis (Console D1)

```sql
-- Listar todos os atestados
SELECT id, paciente, data_emissao, created_at FROM attestations ORDER BY created_at DESC;

-- Buscar por código de validação
SELECT * FROM attestations WHERE codigo_validacao = 'P792.GL02';

-- Buscar por paciente
SELECT * FROM attestations WHERE paciente LIKE '%LUCAS%';

-- Contar total de atestados
SELECT COUNT(*) as total FROM attestations;
```

## Inserir Novo Atestado Manualmente

```sql
INSERT INTO attestations (
  id, codigo_validacao, paciente, sexo, nascimento, cpf,
  nome_mae, endereco, passaporte, condicao, vacinacao, cid,
  medico, crm, especialidade, data_assinatura, hora_assinatura,
  data_emissao, logo_url, endereco_emitente, instituicao
) VALUES (
  'NOVO.ID01', 'NOVO.ID01', 'NOME DO PACIENTE', 'MALE',
  '01/01/1990', '000.000.000-00', 'NOME DA MÃE',
  'ENDEREÇO COMPLETO', 'PASSAPORTE', 'Condição clínica...',
  'YELLOW FEVER', 'T78.0', 'DR. NOME', 'CRM/BA 00000',
  'ESPECIALIDADE', '01/01/2026', '10:00', 'JANUARY 1, 2026',
  NULL, 'AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA',
  'IDAB - SALVADOR/BAHIA'
);
```
