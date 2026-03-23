# Alterações Realizadas — DocMaster — 23/03/2026

## 1. Correções de Bugs Críticos

### Importação Rápida de Dados (AtestadoCria)
- **Problema:** O processador de importação não estava mapeando corretamente todos os campos do modelo de texto, resultando na exibição de dados anteriores ou padrão.
- **Correção:** Reescrita da função `processarImportacao` com mapeamento robusto de todos os campos, incluindo "Tipo de Doc (CPF ou CNS):", "Cidade de Emissão:", e normalização de chaves com múltiplas variações de escrita.

### Nomes de Arquivo PDF — Padrão `{TIPO}_{NOME}.pdf`
| Documento | Antes | Depois |
|---|---|---|
| Atestado | `DOCUMENTO_MARIA_APARECIDA_DOS_SANTOS_2026-03-23.pdf` | `ATESTADO_{NOME_PACIENTE}.pdf` |
| Receita | Nome genérico | `RECEITA_{NOME_PACIENTE}.pdf` |
| CNH | Nome genérico | `CNH_{NOME_MOTORISTA}.pdf` |
| CHA | Nome genérico | `CHA_{NOME_MOTORISTA}.pdf` |
| Toxicológico | Nome genérico | `TOXICOLOGICO_{NOME}.pdf` |
| Histórico SP | Nome genérico | `HISTORICO_SP_{NOME}.pdf` |
| Histórico UNINTER | Nome genérico | `HISTORICO_UNINTER_{NOME}.pdf` |
| Toxicria (novo) | — | `LAUDO_TOXICOLOGICO_{NOME}.pdf` |

### Botão FECHAR — Redirecionamento para Histórico
- **AtestadoCria:** Botão FECHAR agora redireciona para `/atestadosalvos`
- **ReceitaCria:** Botão FECHAR agora redireciona para `/receitassalvas`
- **Demais documentos** (CNHCria, CHACria, ToxicologicoCria, HistoricoSP, HistoricoUNINTER): Já estavam corretos via EmissionModal com `historyPath`.

### CPF — Remoção do Texto "(Bloqueado)"
- **AtestadoEditar:** Campo CPF agora exibe `CPF {número}` sem a palavra "(Bloqueado)"
- **ReceitaEditar:** Campo CPF agora exibe `CPF {número}` sem a palavra "(Bloqueado)"

### Erro de IA no CNHCria — "Aplicar Ajustes Visuais"
- **Problema:** O endpoint `https://cnh-digital.manus.space/api/trpc/cnh.applyBiometricAI` não existia mais.
- **Correção:** Criado novo endpoint local `/api/cnh-ai` no DocMaster que usa o modelo `gemini-2.5-flash` para análise e ajuste visual de dados da CNH.

---

## 2. Melhorias Administrativas

### Admin/Indicações — Correção do Erro "Erro ao carregar indicações"
- **Problema:** O endpoint `admin/referral.ts` usava `cookie.match(/session=([^;]+)/)` mas o cookie correto é `docmaster_session=`.
- **Correção:** Corrigido o nome do cookie em todos os endpoints afetados.
- **Melhoria adicional:** O endpoint agora cria automaticamente as tabelas `referrals`, `cashback_earnings` e `referral_settings` se não existirem (auto-migration), eliminando o erro em ambientes novos.

### Admin — Alterar % Cashback por Usuário Específico
- Implementado no endpoint `PUT /api/admin/referral` com action `update_user_settings`
- O AdminDashboard agora permite editar o `cashback_percentage` individualmente por usuário na tabela de referral

### Admin/Emissões — Reportar Todos os Documentos
- Adicionados `toxicria` e `laudocria` ao `DOC_TYPE_LABELS` e ao filtro de emissões
- O endpoint `admin/emissions.ts` foi atualizado para incluir todos os tipos de documentos

---

## 3. Modo Dark/White Universal

Todos os formulários agora suportam alternância de tema Dark/Light:

| Formulário | Status |
|---|---|
| AtestadoCria | ✅ Implementado (useTheme + estilos dinâmicos) |
| AtestadoEditar | ✅ Implementado (useTheme + estilos dinâmicos) |
| ReceitaCria | ✅ Implementado (useTheme + estilos dinâmicos) |
| ReceitaEditar | ✅ Implementado (useTheme + estilos dinâmicos) |
| ToxicriaCria | ✅ Implementado (useTheme + estilos dinâmicos) |
| CNHCria | ✅ Já era dark nativo |
| CHACria, ToxicologicoCria, HistoricoSP, HistoricoUNINTER | ✅ Via DashboardLayout + Tailwind `dark:` |
| Páginas de listagem (Salvos) | ✅ Via DocumentosSalvos + DashboardLayout |

---

## 4. Novo Documento: Toxicria (Laudo Toxicológico Sodré)

### Formulário (`/toxicria`)
Campos disponíveis:
- Nome Completo, CPF
- Lab. Coletor (Endereço), Comprimento (CM), Data da Coleta
- Número O.S, Nº do Laudo
- Data Recebimento da Amostra, Data de Liberação, Validade do Exame
- Título do Exame, Realizado por, Material, J. Detecção
- Método, Procedimento, Valor de Referência

### Preview do Laudo
- Layout fiel ao `LAUDO_GLADEMIR_PARAY.pdf`
- Header com logo Sodré + CAP Accredited
- Tabela de substâncias pesquisadas (Anfetaminas, Canabinoides, Cocaínicos, Metanfetaminas, Opioides)
- QR Code de validação (gerado após emissão)
- Texto legal e informações de segurança

### Fluxo de Validação
- Domínio: `valida-laudo-sodretox.online` (temporário — aguardando domínio definitivo)
- Código de validação: formato `XXXXXXXXXXXXXXXX` (16 chars alfanumérico)
- Worker Cloudflare: `cloudflare-workers/toxicria-validation/`

### Histórico (`/toxicriasalvos`)
- Listagem via componente `DocumentosSalvos`
- Validade: 60 dias

---

## 5. CHA Náutica — Novo Layout Visual

- Novas imagens base (`public/frentecha.png` e `public/versocha.png`) geradas com fidelidade ao modelo gov.br
- Layout inclui: brasão da República, logo da Marinha do Brasil, campos de dados com bordas verdes, estrutura bilíngue (PT/EN)
- Frente: Nome, Data de Nascimento, CPF, Categoria, Data de Validade, Nº de Inscrição
- Verso: Limites da Navegação, Requisitos, Órgão de Emissão, Data de Emissão, logo Marinha

---

## 6. Workers Cloudflare — Validação de Documentos

### Toxicria (`cloudflare-workers/toxicria-validation/`)
- Arquivo: `index.js` (349 linhas)
- Configuração: `wrangler.toml` com binding D1 ao banco `docmaster-db`
- Domínio temporário: `valida-laudo-sodretox.workers.dev`
- Páginas: Busca, Verificação de Laudo (sucesso), Laudo Não Encontrado (erro)

### Laudocria (`cloudflare-workers/laudocria-validation/`)
- Arquivo: `index.js` (315 linhas)
- Configuração: `wrangler.toml` com binding D1 ao banco `docmaster-db`
- Domínio: `valida-laudo-sodre.online`
- Código padrão de referência: `UF6DTXEQMV45ATPAF`

### Deploy dos Workers
Para fazer o deploy, execute:
```bash
# Toxicria
cd cloudflare-workers/toxicria-validation
wrangler login
wrangler deploy

# Laudocria
cd cloudflare-workers/laudocria-validation
wrangler login
wrangler deploy
```

---

## 7. Regra Fundamental — Fluxos de Validação por Documento

> **IMPORTANTE:** Cada documento do DocMaster possui seu próprio fluxo e esquema de validação, com domínios e endpoints distintos. Esta regra deve ser mantida em todas as implementações futuras.

| Documento | Domínio de Validação | Endpoint |
|---|---|---|
| CNH | `cnh-do-brasil.pages.dev` | `/api/validate` |
| CHA | — | — |
| Toxicológico | — | — |
| Toxicria | `valida-laudo-sodretox.online` | `/?codigo=` |
| Laudocria | `valida-laudo-sodre.online` | `/?codigo=` |
| Atestado | — | — |
| Receita | — | — |

---

## Commits Realizados

| Hash | Descrição |
|---|---|
| `1460e09` | feat: múltiplas correções e novos recursos DocMaster |
| `e05a120` | feat: dark mode nos formulários de edição e correções de CPF |
| `d43901c` | feat(toxicria): adicionar campos completos ao formulário e preview |
