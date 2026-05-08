# Skill: Deploy Cloudflare via Wrangler

## Regra Fundamental
**Sempre que finalizar qualquer alteração no projeto, realizar deploy via Wrangler CLI diretamente no Cloudflare. Nunca deixar alterações sem deploy.**

## Credenciais

```bash
export CLOUDFLARE_API_TOKEN="cfut_BLjbU9ysUuKwHpJyRqrVG59xSaKWyjaHxYCZ2Zf425830fc9"
```

- **Account ID**: `8f0446ea9cc0218364493885ddc1c419`

## Projetos

| Projeto | Repo | Cloudflare Pages Name | D1 Database | Domínio |
|---------|------|----------------------|-------------|---------|
| DocMaster | `rickmateus8-code/docmaster` | `docmaster` | `docmaster-db` (0cfb948c-fd13-4e09-8eaf-26df02e3e615) | docmaster.store |
| IDAB | `rickmateus8-code/atestados-idab` | `atestados-idab` | `atestados-idab` (532fb211-af97-44e9-b679-5c061d0cba02) | validaratestado.digital |

## Fluxo de Deploy Obrigatório

### 1. DocMaster
```bash
cd /home/docmaster
git pull origin main
pnpm install
pnpm build
CLOUDFLARE_API_TOKEN="cfut_BLjbU9ysUuKwHpJyRqrVG59xSaKWyjaHxYCZ2Zf425830fc9" npx wrangler pages deploy dist --project-name=docmaster
```

### 2. IDAB Atestados
```bash
cd /home/atestados-idab
git pull origin main
pnpm install
pnpm build
CLOUDFLARE_API_TOKEN="cfut_BLjbU9ysUuKwHpJyRqrVG59xSaKWyjaHxYCZ2Zf425830fc9" npx wrangler pages deploy dist --project-name=atestados-idab
```

## Regras

1. **Sempre deployar ambos repos** se alterações afetam sincronização (AttestationDocument, validação, QR Code)
2. **Deployar apenas o repo afetado** se alterações são isoladas
3. **NÃO executar migrações D1** automaticamente — as tabelas já existem. Migrações só devem ser executadas quando NOVAS tabelas ou colunas forem criadas explicitamente
4. **Verificar build ANTES do deploy** — se `pnpm build` falhar, NÃO deployar
5. **Verificar o deploy** — após deploy, confirmar que a URL retornada está acessível
6. **NÃO usar `wrangler d1 execute` com arquivos de migração existentes** — isso causa erro `D1_RESET_DO` porque tabelas já existem. Usar apenas para novos SQLs

## Verificação Pós-Deploy

Após cada deploy, verificar:
```bash
# Verificar que o deploy está ativo
curl -s -o /dev/null -w "%{http_code}" https://docmaster.store
curl -s -o /dev/null -w "%{http_code}" https://validaratestado.digital
```

## D1 — Apenas para Novos Schemas

Quando precisar executar SQL novo (nova tabela, nova coluna):
```bash
# Comando único — NÃO usar arquivos de migração existentes
CLOUDFLARE_API_TOKEN="cfut_BLjbU9ysUuKwHpJyRqrVG59xSaKWyjaHxYCZ2Zf425830fc9" \
npx wrangler d1 execute docmaster-db --remote --command "CREATE TABLE IF NOT EXISTS nova_tabela (id TEXT PRIMARY KEY, ...);"
```

## Tabelas Existentes (NÃO recriar)

### DocMaster D1 (23 tabelas, ~45MB)
users, attestations, documents, transactions, sessions, receitas, system_settings, user_presence, referrals, notifications, admin_logs, cashback_earnings, document_pricing, especialidades_drconsulta, medicos_brasil, referral_codes, referral_earnings, referral_settings, system_logs, unidades_drconsulta

### IDAB D1
attestations (30+ registros)

## Layout Protegido (commit ddc2aaa)

Referir à skill `docmaster-layout-preservation` para regras de proteção de layout. JAMAIS alterar `AttestationDocument.tsx` ou `pdfExport.ts` sem solicitação explícita do usuário.
