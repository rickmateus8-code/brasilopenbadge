# Configuração do Cloudflare - Atestados IDAB

## Conta e Projeto

| Propriedade | Valor |
|---|---|
| **Email** | `cideniamenezes@gmail.com` |
| **Account ID** | `8f0446ea9cc0218364493885ddc1c419` |
| **Projeto Pages** | `atestados-idab` |
| **URL Padrão** | `https://atestados-idab.pages.dev` |
| **Domínio Personalizado** | `https://validaratestado.digital` |
| **Repositório GitHub** | `rickmateus8-code/atestados-idab` |

## Banco D1

| Propriedade | Valor |
|---|---|
| **Nome** | `atestados-idab` |
| **ID** | `532fb211-af97-44e9-b679-5c061d0cba02` |
| **Binding** | `DB` |

## Configuração do `wrangler.jsonc`

```jsonc
{
  "name": "atestados-idab",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2024-09-23",
  "observability": { "enabled": true },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "atestados-idab",
      "database_id": "532fb211-af97-44e9-b679-5c061d0cba02"
    }
  ],
  "vars": {
    "ENVIRONMENT": "production",
    "VALIDATION_DOMAIN": "https://validaratestado.digital",
    "API_BASE_URL": "https://atestados-idab.pages.dev"
  }
}
```

## Build Settings (Cloudflare Pages Dashboard)

| Configuração | Valor |
|---|---|
| **Framework preset** | None |
| **Build command** | `pnpm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (raiz do repositório) |
| **Node.js version** | 18+ |

## DNS do Domínio `validaratestado.digital`

O DNS está gerenciado pelo Cloudflare. O registro configurado é:

| Tipo | Nome | Conteúdo |
|---|---|---|
| `CNAME` | `@` (raiz) | `atestados-idab.pages.dev` |

## Acessar o Painel do Cloudflare

- **Workers & Pages**: https://dash.cloudflare.com/8f0446ea9cc0218364493885ddc1c419/workers-and-pages
- **Projeto Pages**: https://dash.cloudflare.com/8f0446ea9cc0218364493885ddc1c419/pages/view/atestados-idab
- **Banco D1**: https://dash.cloudflare.com/8f0446ea9cc0218364493885ddc1c419/workers/d1/databases/532fb211-af97-44e9-b679-5c061d0cba02
- **DNS**: https://dash.cloudflare.com/8f0446ea9cc0218364493885ddc1c419/validaratestado.digital/dns/records

## Procedimento de Deploy Manual (via CLI)

```bash
# 1. Instalar dependências
pnpm install

# 2. Build
pnpm run build

# 3. Login no Cloudflare
npx wrangler login

# 4. Deploy
npx wrangler pages deploy dist --project-name atestados-idab

# 5. Executar migração D1 (apenas na primeira vez)
npx wrangler d1 execute atestados-idab --file=migrations/0001_initial.sql --remote
```
