# DocMaster - Diretrizes Fundamentais de Engenharia

Este arquivo contém mandatos inegociáveis para qualquer agente de IA ou desenvolvedor que atuar neste projeto.

## 1. Fluxo de Deploy e Sincronia
*   **REGRA DE OURO:** O fluxo é sempre **Ambiente Local > GitHub > Cloudflare**.
*   Nunca realize alterações apenas localmente ou direto no Cloudflare sem realizar o `git push origin main`.
*   O estado de paridade atual está consolidado no commit `ff8b618`.

## 2. Identidade Visual (Estado de Ouro)
*   **Layout A4:** Fundo Branco Absoluto (#ffffff), sem bordas cinzas ou sombras pesadas no PDF.
*   **Preview Inteligente:** O sistema de Zoom Dinâmico e Navegação por Foco deve ser preservado. Não use scrollbars brutas. O enquadramento é fixo ao topo (`transformOrigin: top center`) e utiliza navegação vertical por seções (`TOP` e `BOTTOM`) com botões ▲, ▼ e 🔍.
*   **Cores:** Modais de Novo Documento e Recarga devem ser VERDES (#059669). Headers de emissão devem ser AZUL DOCMASTER (#005CA9).
*   **Marca d'água:** Texto 'DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA' (54px, vermelho transparente, zIndex 99).

## 3. Padrões de Código e Governança
*   **Sem Gambiarras:** Alterações de UI devem ser feitas via CSS/Estilos sólidos e não via hacks temporários.
*   **API Snoop:** Manter o padrão de endereço: `{ENDEREÇO}, {NUMERO} - {BAIRRO}, {CIDADE}/{UF}` com o conversor de siglas de estado.
*   **Saldo:** Garantir que o backend sempre retorne `newBalance` para atualização em tempo real no frontend.
*   **Retenção:** Petição STJ (3 dias), demais documentos (30 dias). Limpeza automática (Lazy DELETE) a cada emissão.
*   **Resiliência:** Modais críticos devem possuir fallback local (hardcoded) para o caso de falha nas APIs de precificação.

## 4. Mandatos de Segurança e Estabilidade
*   **PROIBIÇÃO DE EXCLUSÃO:** Jamais apagar blocos de código existentes (especialmente buscas de médicos ou UPAs) sem plano aprovado. Erros de compilação devem ser resolvidos via tipos, nunca via remoção.
*   **MANDATO DE BUILD:** Proibido realizar `git push` sem executar `npm run build` localmente para validar o bundle (evitar erros de duplicidade de imports que causam tela branca).
*   **INTEGRIDADE 1:1:** O layout gerado no DocMaster deve ser espelhado com perfeição no validador IDAB.

*Este documento é a alma do projeto. Respeite-o.*
