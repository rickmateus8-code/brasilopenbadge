---
name: docmaster-painel
description: Conhecimento base e regras de implementação para o painel Docmaster (geração e validação de documentos como atestados, CNH, etc). Use para entender a arquitetura do projeto, regras de layout, fluxo de criação/validação e peculiaridades técnicas do Cloudflare e html2canvas.
---

# Skill: Docmaster - Painel de Geração e Validação de Documentos

Esta skill documenta todo o conhecimento acumulado durante a refatoração e implementação do sistema de Atestados IDAB, que faz parte do ecossistema maior **Docmaster**.

## 1. Arquitetura do Sistema

O ecossistema é composto por dois fluxos principais que se complementam:

1. **Criação (Painel Principal)**
   - **Domínio:** `docmaster.store` (ou subdomínios específicos do painel)
   - **Fluxo:** O usuário preenche o formulário (ex: `/atestado`), o sistema gera um código QR único e emite o documento em PDF.
   - **Banco de Dados:** Cloudflare D1 (para persistência do atestado gerado).

2. **Validação (Frontend Público)**
   - **Domínio:** `validaratestado.digital` (para atestados), com URLs do tipo `/v/{CODIGO}`.
   - **Fluxo:** O paciente/empresa escaneia o QR Code no PDF, é direcionado para a página de validação, que consulta o banco D1 e exibe o documento digital idêntico ao impresso.

## 2. Peculiaridades Técnicas e Soluções Definitivas

### 2.1 Geração de PDF via `html2canvas` + `jsPDF`

A geração de PDF no cliente sofre com três problemas graves em dispositivos móveis e layouts complexos:

- **Erro de Transform Scale:** O `html2canvas` falha silenciosamente se tentar capturar um elemento que está dentro de um container com `transform: scale()`. O canvas gerado fica vazio ou com dimensões distorcidas.
- **Cores oklch do TailwindCSS v4:** O `html2canvas 1.4.1` **não suporta** a função de cor CSS `oklch()`. Se o elemento capturado herdar estilos globais do Tailwind v4, o script trava com o erro: `Error: Attempting to parse an unsupported color function "oklch"`.
- **CORS em Imagens:** Imagens de URLs externas (CDNs, S3) falham a captura por regras de CORS.

**Solução Implementada (Padrão Ouro):**
A função `exportElementToPDF` (em `client/src/lib/pdfExport.ts`) resolve tudo isso criando um `<iframe>` oculto (`srcdoc`).
1. O documento é clonado para dentro do iframe.
2. Isso isola o documento dos estilos globais do Tailwind (resolvendo o problema do `oklch`).
3. O container interno tem largura fixa exata (`1010px`), resolvendo o problema do `transform: scale`.
4. Todas as imagens são pré-convertidas para Base64 antes da captura, resolvendo o CORS.

### 2.2 Proporção Mobile do Viewer

O viewer de validação (`Validation.tsx`) precisa exibir o documento inteiro na tela, sem scroll, mantendo a proporção exata de um papel A4.

**Solução:**
Cálculo duplo de escala baseado nas dimensões matemáticas do A4 (210x297mm):
```javascript
const DOC_REAL_WIDTH = 1010;
const DOC_A4_HEIGHT = 1010 * (297 / 210); // ≈ 1428px

const scaleByWidth = availableWidth / DOC_REAL_WIDTH;
const scaleByHeight = availableHeight / DOC_A4_HEIGHT;
const docScale = Math.min(scaleByWidth, scaleByHeight);
```

## 3. Funcionalidades do Formulário de Criação

Ao replicar formulários do site de referência (`docmaster.store`), siga estas regras:

1. **Busca de Médicos no Supabase:**
   - A API pública do CFM tem bloqueios de CORS e reCAPTCHA. A alternativa é usar um banco Supabase.
   - **Regra de Ouro para Timeout:** O banco tem mais de 1 milhão de registros. Consultas abertas causam timeout. **A UF (Estado) deve ser um filtro obrigatório** antes de qualquer busca por nome ou CRM.
   - Exemplo de query segura: `uf_crm=eq.${UF}&nome_medico=ilike.*${TERMO}*`

2. **Upload de Imagens (Logos e Assinaturas):**
   - Nunca dependa de URLs externas para logos inseridas pelo usuário.
   - Use `FileReader` para ler o arquivo localmente e converter para **Base64** imediatamente no estado do React. Isso garante que o `html2canvas` conseguirá capturar a imagem sem erros de CORS.

3. **Logos Padrão:**
   - Foram implementadas 9 logos padrão na galeria (IDAB, Amil, Hapvida, Unimed, etc.). Elas ficam em `/client/public/logos/`.

4. **Layout Visual do Atestado:**
   - Fundo: `radial-gradient(#ddd 1px)`
   - Fonte: `Inter, sans-serif`
   - Fonte da assinatura cursiva: `Herr Von Muellerhoff` (45px)
   - Estrutura: Header (logos + título), Patient Box (borda 1px solid #000), Corpo do texto (justify, line-height 1.8), Rodapé (QR Code + Assinatura).

## 4. Próximos Passos (Integração do Painel Docmaster)

Quando o arquivo `.zip` do painel Docmaster for fornecido, os seguintes passos devem ser executados:

1. **Extração e Estruturação:** Integrar o projeto atual de atestados como uma rota/slug (`/atestado`) dentro da arquitetura do painel principal.
2. **Reaproveitamento:** A lógica robusta de `pdfExport.ts` (com iframe isolado) deve ser elevada para o nível do painel e reutilizada por todos os outros documentos (CNH, CHA Náutica, etc.).
3. **Banco de Dados:** Garantir que o Worker do Cloudflare consiga salvar os dados completos do novo formulário no banco D1 (atualmente o backend salva apenas os campos antigos).

---
**Nota para o Agente:** Antes de modificar o fluxo de exportação de PDF ou o viewer mobile, consulte as seções 2.1 e 2.2 para não reintroduzir os bugs clássicos do `html2canvas` e Tailwind v4.
