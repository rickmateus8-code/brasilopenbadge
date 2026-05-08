---
name: atestados-idab-deploy
description: Especificações, arquitetura e guia de deploy para o projeto Atestados IDAB. Use esta skill para entender a estrutura do projeto, realizar manutenções, criar novas funcionalidades ou configurar o ambiente no Cloudflare Pages e D1.
---

# Projeto Atestados IDAB — Guia para Agentes Manus

Esta skill contém toda a documentação necessária para que um agente Manus trabalhe no projeto **Atestados IDAB** de forma autônoma e consistente.

## Repositório e Acesso

- **GitHub**: `rickmateus8-code/atestados-idab` — clonar com `gh repo clone rickmateus8-code/atestados-idab`
- **Site Público (Validação)**: https://validaratestado.digital
- **Painel Administrativo**: https://atestados-idab.pages.dev
- **Configurações Cloudflare**: ver `references/cloudflare-config.md`

## Arquitetura

| Camada | Tecnologia | Localização |
|---|---|---|
| Frontend | React + Vite + TailwindCSS | `client/src/` |
| Backend | Cloudflare Pages Functions | `functions/` |
| Banco de Dados | Cloudflare D1 (SQLite) | Console D1 / `migrations/` |
| Deploy | Cloudflare Pages | Auto via push no `main` |

## Estrutura de Diretórios

```
atestados-idab/
├── client/src/
│   ├── components/AttestationDocument.tsx  # Layout do atestado (PDF)
│   ├── lib/
│   │   ├── pdfExport.ts       # Exportação PDF (html2canvas + jsPDF)
│   │   ├── dateMask.ts        # Máscara automática DD/MM/AAAA
│   │   └── apiClient.ts       # Chamadas à API D1
│   ├── pages/
│   │   ├── Home.tsx           # Painel administrativo
│   │   ├── CreateAttestation.tsx  # Formulário de emissão
│   │   └── Validation.tsx     # Validação pública via QR Code
│   ├── App.tsx                # Roteamento por domínio
│   └── config.qrcode.ts       # URL base do QR Code
├── functions/api/             # Endpoints serverless
├── migrations/0001_initial.sql  # Schema do banco D1
└── wrangler.jsonc             # Config Cloudflare
```

## Regras de Negócio Críticas

**Datas**: Todos os campos de data usam formato `DD/MM/AAAA` com barras automáticas (`dateMask.ts`). A Data de Emissão é convertida para inglês por extenso (ex: `MARCH 16, 2026`) apenas no documento final via `formatDateToEnglish()`.

**QR Code**: Aponta para `https://validaratestado.digital/v/:codigo`. O código é gerado no backend no formato `XXXX.XXXX` (ex: `P792.GL02`).

**Roteamento por domínio** (`App.tsx`):
- `validaratestado.digital/` → Página de Validação (pública)
- `atestados-idab.pages.dev/` → Home (painel administrativo)

**Armazenamento híbrido**: API D1 como primário, `localStorage` como fallback automático.

## Fluxo de Deploy

1. Fazer alterações no código
2. Testar localmente: `pnpm run build`
3. Commit e push: `git push origin main`
4. O Cloudflare Pages faz o deploy automático em ~2 minutos

> **Atenção**: Nunca commitar arquivos `_worker.js` em `client/public/` — causa loop de redirect no Cloudflare Pages.

## Referências Detalhadas

Leia os arquivos abaixo quando necessário:

- **`references/d1-schema.md`** — Schema completo da tabela, consultas SQL úteis e como inserir atestados manualmente
- **`references/api-endpoints.md`** — Todos os endpoints da API com exemplos de request/response
- **`references/cloudflare-config.md`** — Account ID, IDs do banco D1, configurações de build e DNS

## Checklist para Novas Funcionalidades

Ao adicionar um novo campo ao atestado:
1. `client/src/data/attestations.ts` — atualizar interface `AttestationData`
2. `client/src/pages/CreateAttestation.tsx` — adicionar campo no formulário
3. `client/src/components/AttestationDocument.tsx` — exibir no layout do PDF
4. `functions/utils/db.ts` — atualizar queries SQL
5. `migrations/` — criar novo arquivo de migração (ex: `0002_add_campo.sql`)
6. Executar migração no console D1 do Cloudflare
