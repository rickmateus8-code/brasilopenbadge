# Configuração do Projeto para Cloudflare Pages + Functions + D1

Este documento descreve como configurar e fazer deploy do projeto **atestados-idab** no Cloudflare.

## Arquitetura

O projeto está estruturado para rodar em:

- **Frontend**: Cloudflare Pages (React + Vite)
- **Backend**: Pages Functions (serverless functions no diretório `/functions`)
- **Database**: Cloudflare D1 (SQLite serverless)

## Pré-requisitos

1. Conta Cloudflare ativa
2. Node.js 18+ instalado
3. npm ou pnpm instalado
4. Wrangler CLI instalado: `npm install -g wrangler`

## Passo 1: Autenticar com Cloudflare

```bash
wrangler login
```

Isso abrirá uma janela do navegador para autenticar sua conta Cloudflare.

## Passo 2: Criar Banco de Dados D1

```bash
# Criar banco de dados de produção
npx wrangler d1 create atestados-idab

# Criar banco de dados de staging (opcional)
npx wrangler d1 create atestados-idab-staging
```

Copie o `database_id` retornado e atualize o arquivo `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "atestados-idab",
    "database_id": "PASTE_YOUR_DATABASE_ID_HERE"
  }
]
```

## Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` local (não será commitado):

```bash
cp .env.example .env
```

Edite `.env` com seus valores:

```env
ENVIRONMENT=development
API_BASE_URL=http://localhost:8787/api
```

## Passo 4: Inicializar Banco de Dados

Execute as migrações para criar as tabelas:

```bash
# Localmente
npm run db:migrate

# Remotamente (após deploy)
npm run db:migrate:remote
```

## Passo 5: Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:8787`

## Passo 6: Build do Frontend

```bash
npm run build
```

Isso gera os arquivos estáticos em `dist/`

## Passo 7: Deploy

### Deploy para Produção

```bash
npm run deploy:production
```

### Deploy para Staging

```bash
npm run deploy:staging
```

### Deploy Padrão

```bash
npm run deploy
```

## Estrutura de Diretórios

```
projeto/
├── client/                 # Frontend React/Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
│   └── public/
├── functions/              # Backend (Pages Functions)
│   ├── api/
│   │   ├── attestations.ts      # GET/POST /api/attestations
│   │   ├── [id].ts              # GET/PUT/DELETE /api/attestations/:id
│   │   └── validate/[code].ts   # GET /api/validate/:code
│   ├── middleware/
│   │   └── cors.ts
│   ├── utils/
│   │   └── db.ts
│   └── types.ts
├── migrations/             # D1 migrations
│   └── 0001_initial.sql
├── dist/                   # Build output (gerado)
├── wrangler.jsonc          # Configuração Cloudflare
├── vite.config.ts          # Configuração Vite
└── package.json
```

## Endpoints da API

Todos os endpoints estão prefixados com `/api`:

### Atestados

- `GET /api/attestations` - Listar todos os atestados
- `POST /api/attestations` - Criar novo atestado
- `GET /api/attestations/:id` - Obter atestado por ID
- `PUT /api/attestations/:id` - Atualizar atestado
- `DELETE /api/attestations/:id` - Deletar atestado

### Validação

- `GET /api/validate/:code` - Validar atestado por código
- `GET /api/validate/:code?date=DD/MM/YYYY` - Validar com data

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `ENVIRONMENT` | Ambiente (production/staging/development) | production |
| `API_BASE_URL` | URL base da API | https://atestado-valide.digital/api |
| `DB` | Binding D1 (automático) | - |

## Secrets (Sensíveis)

Para armazenar secrets de forma segura:

```bash
# Adicionar secret
npx wrangler secret put MY_SECRET

# Listar secrets
npx wrangler secret list

# Deletar secret
npx wrangler secret delete MY_SECRET
```

Os secrets são acessíveis em seu código via `env.MY_SECRET`.

## Debugging

### Logs Locais

```bash
npm run dev
```

Todos os logs aparecem no console.

### Logs Remotos

```bash
npx wrangler tail
```

Visualiza logs em tempo real do seu Worker em produção.

### Queries D1

```bash
# Query local
npx wrangler d1 execute atestados-idab --command "SELECT * FROM attestations"

# Query remota
npx wrangler d1 execute atestados-idab --remote --command "SELECT * FROM attestations"
```

## Configuração de Domínio

1. Acesse o painel do Cloudflare
2. Vá para **Workers & Pages** > **atestados-idab**
3. Clique em **Custom domains**
4. Adicione seu domínio: `atestado-valide.digital`

O SSL/TLS é configurado automaticamente.

## Monitoramento

### Analytics

No painel do Cloudflare, você pode visualizar:

- Requisições por segundo
- Latência média
- Taxa de erro
- Uso de CPU e memória

### Observability

Ative observability no `wrangler.jsonc`:

```jsonc
"observability": {
  "enabled": true
}
```

## Troubleshooting

### Erro: "D1 database not found"

Certifique-se de que o `database_id` está correto no `wrangler.jsonc`.

### Erro: "CORS error"

Verifique que os headers CORS estão sendo retornados corretamente. Todos os endpoints têm CORS habilitado por padrão.

### Erro: "Worker exceeded CPU time limit"

Reduza operações CPU-intensive ou use caching com KV.

### Erro: "Memory limit exceeded"

Evite bufferizar respostas grandes. Use streaming em vez disso.

## Próximos Passos

1. Configurar CI/CD com GitHub Actions
2. Implementar caching com Cloudflare KV
3. Adicionar autenticação com Cloudflare Access
4. Configurar alertas e monitoramento
5. Implementar backup automático do D1

## Referências

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Pages Functions Documentation](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
