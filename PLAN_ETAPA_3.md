# Plano de Implementação: Motor Universal - Etapa 3 (Saldo e Histórico Dinâmico)

Este plano visa unificar o sistema de cobrança (Universal Saldo) e tornar o Dashboard inteligente, adaptando-se automaticamente aos novos templates criados no banco de dados.

## 1. Backend: Saldo Universal e Unificação de Preços
**Arquivo:** `functions/api/documents/[[type]].ts`
*   **Ação:** Refatorar a lógica de precificação no `onRequestPost`.
*   **Detalhes:**
    *   Antes de usar o objeto `DOCUMENT_PRICES` (hardcoded), o sistema deve consultar a tabela `document_templates` usando o `slug` (tipo do documento).
    *   Se o template existir, o `price` do banco (REAL) será convertido para centavos (x100) e usado como valor oficial de débito.
    *   Manter a prioridade de `is_free` e `admin` (custo zero).
    *   Garantir que o `seq_id` para CNH continue funcionando e estender uma lógica de contador para outros tipos se necessário.

## 2. Dashboard: Histórico com Abas Automáticas
**Arquivo:** `client/src/pages/Dashboard.tsx`
*   **Ação:** Dinamizar a constante `HISTORY_TABS`.
*   **Detalhes:**
    *   No `useEffect` inicial, buscar todos os templates ativos via `/api/templates`.
    *   Concatenar os templates encontrados (que não sejam os legados atestado/receita/cnh/cha/etc já fixos) à lista de abas.
    *   Ajustar a função `loadHistory` para aceitar qualquer `slug` dinâmico e renderizar a tabela genérica de documentos.
    *   Garantir que os ícones das novas abas usem um fallback (ex: `FileText`) caso não haja ícone definido no banco.

## 3. Componentes e UI
**Arquivos:** `client/src/pages/UniversalEmissor.tsx`, `client/src/pages/TemplateManager.tsx`
*   **Ação:** Garantir que o preço exibido nos modais de confirmação seja o que vem do banco.
*   **Detalhes:**
    *   Revisar o `UniversalEmissor.tsx` para passar o preço correto para o `EmissionModal`.

## 4. Validação e Testes
*   **Teste 1:** Criar/Verificar um template no banco (ex: `peticao-stj-v3`).
*   **Teste 2:** Emitir o documento e verificar se o débito no saldo do usuário corresponde exatamente ao `price * 100` do template.
*   **Teste 3:** Abrir o Dashboard e verificar se uma nova aba com o nome do template apareceu automaticamente.
*   **Teste 4:** Verificar se o documento emitido aparece na lista dessa nova aba.

## 5. Deploy
*   Executar `npm run build` para garantir integridade.
*   Deploy para Cloudflare Pages.
*   Sincronia via Git.
