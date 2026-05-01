---
name: docmaster-forensic-integrity
description: Mandatos de engenharia forense e sincronia para DocMaster (emissão) e IDAB (validação). Use para garantir paridade 1:1, resolver problemas de carregamento de logos (CORS), e manter a integridade visual dos documentos médicos.
---

# DocMaster Forensic Integrity

Esta skill governa o estado de ouro da emissão e validação de documentos no ecossistema DocMaster.

## Diretrizes Críticas de Engenharia

### 1. Sincronia de Logos e CORS
Ao lidar com logos (instituição ou assinatura), utilize sempre a lógica de `getCrossOrigin`:
- **Base64 (`data:`)**: `crossOrigin` deve ser `undefined`.
- **Mesmo Domínio**: `crossOrigin` deve ser `undefined`.
- **Domínio Externo (Validador)**: `crossOrigin` deve ser `"anonymous"`.
- **Mandato**: Verifique se o arquivo `client/public/_headers` permite acesso CORS às pastas `/logos/*` e `/assets/*`.

### 2. Integridade de Dados (Fallback de Instituição)
O sistema de preview exibe fallbacks (ex: `PREFEITURA DE {CIDADE}`).
- **MANDATO:** O payload de emissão (`POST /api/attestations`) deve capturar esse fallback manualmente se o campo `form.instituicao` estiver vazio. Caso contrário, o banco salvará o valor genérico "CLÍNICA / HOSPITAL", quebrando a paridade no validador.

### 3. Layout Forense e Exportação PDF
- **Rodapé:** Mantenha `overflow: visible` e `paddingBottom: 4` (ou superior) para evitar cortes no código único durante a conversão para PDF.
- **Assinatura:** A data exibida na rubrica deve ser `data_assinatura` (obtida via query SQL `a.data_assinatura`). Nunca use a data atual do sistema ou faça fallback apenas para `data_emissao`.
- **Responsividade:** Use `clamp()` para textos longos no header (nome do paciente) para evitar quebras de linha em dispositivos mobile no validador.

## Fluxo de Trabalho
Para entender o fluxo completo de sincronia entre os domínios `docmaster.store` e `validaratestado.digital`, leia o arquivo de referência:
[Workflow de Integridade](references/workflow.md)

## Regras de "Nunca Fazer" (Anti-Padrões)
- **NUNCA** apague binários de logos sem backup; se corrompidos, restaure do commit `9b3a7c9`.
- **NUNCA** realize deploy no Cloudflare sem rodar `npm run build` localmente.
- **NUNCA** altere o componente `AttestationDocument` sem verificar o impacto visual no ambiente de validação (IDAB).
