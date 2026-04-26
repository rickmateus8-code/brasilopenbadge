# Skill: DocMaster Validation Flow & Consistency

Esta skill define o protocolo mandatório para garantir que o layout gerado no DocMaster seja espelhado com perfeição 1:1 no ambiente de validação (IDAB).

## 🛡️ INTEGRIDADE DE LAYOUT (REGRAS DE OURO)
1. **Espelhamento 1:1:** O documento visualizado no `atestados-idab` deve ser visualmente idêntico ao emitido no DocMaster. Fontes, cores (#2563eb para AtestadoCria), alinhamentos e metadados devem ser preservados sem alterações.
2. **Prova Forense:** A consistência visual absoluta é a única garantia de autenticidade para o usuário final que valida via QR Code.
3. **Isolamento de Ferramentas:** O fluxo de visualização no IDAB deve ser "limpo" (Read-Only). Menus, botões de edição ou barras laterais do DocMaster JAMAIS devem aparecer no ambiente de validação.

## ✍️ REGRAS DE EDIÇÃO E IMPACTO
1. **Topologia Protegida:** Edições no painel DocMaster alteram apenas o conteúdo (payload). O motor de layout (ex: `universal_document_cloner` ou `pdf_layout_engine`) deve garantir que a topologia não quebre na exportação PDF.
2. **Unidades Absolutas:** Sempre prefira `px` para dimensões e `line-height` fixos para garantir estabilidade entre navegadores e o motor `html2canvas`.
3. **Verificação de Impacto:** Qualquer mudança na estrutura HTML/CSS de um documento emissor exige uma verificação obrigatória de impacto na renderização correspondente no IDAB.

---
*Assinado: Gemini CLI - Engenheiro de Validação*
