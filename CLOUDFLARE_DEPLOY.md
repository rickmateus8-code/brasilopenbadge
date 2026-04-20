# Deploy DocMaster no Cloudflare

## Deploy Automático (CI/CD)

O projeto possui deploy automático via **GitHub Actions**. A cada push na branch `main`, o workflow executa:

1. Instala dependências (`npm ci`)
2. Faz build do frontend (`npm run build`)
3. Faz upload direto para Cloudflare Pages via `wrangler pages deploy --branch=main`
4. Aplica migrações pendentes no D1 com `wrangler d1 migrations apply --remote`

### Configuração Necessária (Secrets do GitHub)

No repositório GitHub, vá em **Settings > Secrets and variables > Actions** e adicione:

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `CLOUDFLARE_API_TOKEN` | Token da API Cloudflare | Cloudflare Dashboard > My Profile > API Tokens > Create Token > "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | ID da conta Cloudflare | Cloudflare Dashboard > Workers & Pages > canto direito da página |

### Permissões do API Token

Ao criar o token, garanta as seguintes permissões:
- **Account > Cloudflare Pages > Edit**
- **Account > Cloudflare Workers Scripts > Edit**
- **Account > D1 > Edit**

### Deploy Manual

Você também pode disparar o deploy manualmente:
1. Vá em **Actions** no repositório GitHub
2. Selecione o workflow "Deploy to Cloudflare Pages"
3. Clique em **Run workflow**

## Configuração de Domínio

1. No painel Cloudflare, vá em **Workers & Pages > docmaster**
2. Clique em **Custom domains**
3. Adicione: `docmaster.store`
4. O SSL/TLS é configurado automaticamente

## Banco de Dados D1

- **Nome:** `docmaster-db`
- **ID:** `0cfb948c-fd13-4e09-8eaf-26df02e3e615`
- As migrações são executadas automaticamente no deploy

## Variáveis de Ambiente

Definidas em `wrangler.jsonc`:
- `ENVIRONMENT`: production
- `APP_DOMAIN`: docmaster.store
- `VALIDATION_BASE_URL`: https://validaratestado.digital

## Troubleshooting

### Erro: "Project not found"
Certifique-se que o projeto `docmaster` existe no Cloudflare Pages. Se não existir, crie manualmente:
```bash
npx wrangler pages project create docmaster
```

### Erro: "Authentication error"
Verifique que o `CLOUDFLARE_API_TOKEN` tem as permissões corretas e não expirou.

### Erro: "D1 database not found"
Verifique que o `database_id` no `wrangler.jsonc` está correto.
