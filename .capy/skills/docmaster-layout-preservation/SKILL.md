# Skill: Preservação de Layout DocMaster & IDAB

## Regra Fundamental
**JAMAIS alterar o layout visual dos documentos (Atestados, CNH, CHA, Receitas, Históricos, Laudos) sem consentimento explícito ou solicitação direta do usuário.**

O layout de referência foi estabelecido no commit `ddc2aaa` do repositório `rickmateus8-code/docmaster`.

## Componentes Protegidos

### 1. AttestationDocument.tsx (DocMaster)
**Arquivo**: `client/src/components/AttestationDocument.tsx`
- Dimensões A4: 794px × 1123px (96dpi)
- Padding: 56px top/bottom, 60px left/right
- Font-family: Arial, Helvetica, sans-serif
- QR Code: cores pretas (#000000), fundo branco, opacidade e blur condicional para pré-emissão
- Cabeçalho: 3 colunas (Logo Esquerda | Info Institucional | Logo Direita)
- Rodapé: 3 colunas (Data/Validação | QR Code 90×90px | Médico/Assinatura)
- Assinatura: cor configurável (padrão #0b109f), suporte a imagem ou texto cursivo
- Moldura: bordas 2px solid #000
- Texto "Documento assinado digitalmente conforme MP nº 2.200-2" no rodapé

### 2. AttestationDocument.tsx (IDAB)
**Arquivo**: `client/src/components/AttestationDocument.tsx` no repo `atestados-idab`
- DEVE ser cópia visual exata do componente no DocMaster
- Qualquer alteração no DocMaster DEVE ser replicada no IDAB

### 3. CNHDocument.tsx
**Arquivo**: `client/src/components/CNHDocument.tsx`
- Escala de assinatura: ratio * 1.0 (sem redução)
- Posição vertical: ajuste de -5px
- Transparência PNG preservada em uploads de assinatura

### 4. pdfExport.ts
**Arquivo**: `client/src/lib/pdfExport.ts`
- DOC_REAL_WIDTH = 794px (A4 96dpi, 210mm) — NÃO ALTERAR
- DOC_REAL_HEIGHT = 1123px (A4 96dpi, 297mm) — NÃO ALTERAR
- Estratégia iframe com srcdoc — NÃO ALTERAR
- Conversão de imagens para base64 antes da captura — NÃO ALTERAR
- Escala limitada a 1.5 em mobile (DPR > 2) — NÃO ALTERAR

## Características Visuais Preservadas (commit ddc2aaa)

### QR Code
- Cores: preto (#000000) sobre branco (#FFFFFF)
- Nível de correção: M (Medium)
- Tamanho: 90×90px no documento
- Borda: 1.5px solid #000
- Em pré-emissão: blur e opacidade aplicados condicionalmente
- Em documento emitido: sem blur, opacidade total

### Tipografia
- Título institucional: 13px
- Título "ATESTADO MÉDICO": 18px, letter-spacing ajustado
- Conteúdo: 10-11px
- Rodapé: 8-9px
- Rótulos em **negrito**, valores em texto normal

### Layout de Formulário (AtestadoCria)
- Seções agrupadas: Dados do Paciente, Informações Médicas, Configuração do Documento
- Preview A4 em tempo real ao lado do formulário
- Galeria de logos padrão com controles de escala/posição
- CPF lookup via Snoop API com auto-preenchimento

## Regras de Manutenção

1. **Antes de qualquer alteração visual**: Verificar se há solicitação explícita do usuário
2. **Paridade DocMaster ↔ IDAB**: Sempre replicar alterações visuais em ambos repos
3. **PDF Export**: O que o usuário vê no Preview = o que é gerado no PDF = o que aparece na validação
4. **Testes obrigatórios** após qualquer alteração de layout:
   - Preview no formulário
   - PDF exportado
   - Visualização na tela de validação (IDAB)
   - Mobile e Desktop

## Domínios e Infraestrutura
- **DocMaster**: docmaster.store (Cloudflare Pages, D1: docmaster-db)
- **IDAB**: validaratestado.digital (Cloudflare Pages, D1: atestados-idab)
- **Cloudflare Account ID**: 8f0446ea9cc0218364493885ddc1c419
- **Deploy**: GitHub Actions com wrangler pages deploy (upload direto, sem git integration)
