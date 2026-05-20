# Lições Aprendidas e Protocolos — Sessão 19/05/2026

## 1. Erros Críticos e Soluções (Post-Mortem)

### A. Truncamento de Arquivos Grandes (`AtestadoCria.tsx`)
- **Erro:** Tentar reescrever arquivos de 2500+ linhas resultou em truncamento e `ReferenceError` (ex: `TEXTO_PADRAO`).
- **Lição:** **JAMAIS** use `write_file` em componentes complexos se não tiver o conteúdo 100% íntegro. Prefira `replace` cirúrgico ou restaure via `git checkout` se a integridade for comprometida.

### B. Deploy de Diretório Errado (IDAB)
- **Erro:** Deploy da pasta `client` (source) em vez de `dist` (bundle) causou quebra de estilos e aparecimento de bordas brancas.
- **Lição:** O comando de produção **SEMPRE** deve ser `npx wrangler pages deploy dist`. O ambiente de validação depende do bundle buildado para paridade total.

### C. Conflito de Tipos no Banco D1 (`transactions`)
- **Erro:** Inserção de string UUID em coluna `INTEGER PRIMARY KEY AUTOINCREMENT`.
- **Lição:** Remova o campo `id` de comandos `INSERT` em tabelas com autoincrement para evitar Erro 500 silencioso.

### D. Prioridade CSS (Tailwind 4)
- **Erro:** Bordas brancas persistentes no validador devido à sobreposição de temas.
- **Lição:** Use injeção de classe no `body` via `App.tsx` e regras `!important` no `index.css` para forçar backgrounds em domínios específicos.

## 2. Fluxos e Lógicas de Elite

### A. Arquitetura "Cérebro Único" (SSOT)
- **Local:** `client/src/config/attestationLayout.ts`.
- **Lógica:** Centraliza todas as coordenadas de carimbo, paddings de exportação e dimensões A4.
- **Uso:** Importado pelo `AttestationDocument` para garantir que Mudança em 1 = Reflexo em Todos.

### B. Motor de Exportação Unificado
- **Lógica:** Tanto `/atestadocria` quanto o histórico usam a função `downloadAttestationPdf` (`attestationActions.tsx`).
- **Vantagem:** Elimina interferência de zoom e escala do navegador, garantindo PDFs idênticos em qualquer dispositivo.

### C. Protocolo de Deploy Bipartido
- **Mandato:** Alterações em componentes compartilhados (ex: `AttestationDocument`) exigem deploy simultâneo em `docmaster` e `atestados-idab`.

## 3. Filtros de Unicidade
- **Código de Emissão:** Alfanumérico (`RZS9.YP8W`).
- **Filtro:** Checagem assíncrona em `attestations` e `documents` antes de cada salvamento para garantir que um código **JAMAIS** seja duplicado.
