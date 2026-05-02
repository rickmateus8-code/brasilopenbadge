---
name: pdf-replication-forensics
description: Engenharia de replicação 1:1 de documentos PDF para React. Use quando precisar clonar o layout exato de um PDF (como petições ou formulários oficiais) garantindo paridade visual absoluta, tipografia estrita e posicionamento via coordenadas fixas para validação externa (IDAB).
---

# Replicação Forense de PDFs

Esta skill define o fluxo de trabalho para converter um documento PDF estático em um componente React (`.tsx`) com fidelidade visual 1:1.

## Princípios de Design

1. **Coordenadas Absolutas**: Use `position: absolute` com `top` e `left` em pixels para todos os elementos de texto e imagens.
2. **Dimensões A4**: O container deve ter exatamente `794px` de largura por `1123px` de altura (96 DPI).
3. **Tipografia Estrita**: 
   - Petições/Jurídico: Use `Times New Roman` ou `serif`.
   - Atestados: Use `Arial` ou `Helvetica`.
   - Tamanhos de fonte devem ser especificados em `pt` ou `px` conforme o modelo original.

## Fluxo de Trabalho

1. **Análise Espacial**:
   - Identifique os blocos fixos (logos, brasões, linhas divisórias).
   - Mapeie os campos variáveis (nomes, processos, datas, valores).
   - Use o sistema de coordenadas em **pontos (pt)** para paridade com PDFs originais (1pt = 1.333px).

2. **Implementação do Componente**:
   - Crie um componente `forwardRef` para permitir a exportação via `html2canvas`/`jspdf`.
   - Use uma camada de fundo (`img` ou `svg`) com ativos pré-processados (opacidade já aplicada se for marca d'água).
   - Implemente a marca d'água de prévia com `zIndex: 99` e bordas espessas para invalidar visualmente.

3. **Engenharia de Exportação Avançada (Estratégia Elite)**:
   - Para documentos que exigem sobreposição perfeita de logos em PDFs base, utilize a biblioteca `pdf-lib`.
   - Configuração recomendada: `{ mode: "overlay", preserveOriginal: true }`.
   - Utilize ferramentas como `qpdf` ou `Ghostscript` (em ambientes compatíveis) para otimização de camadas e compressão forense.

4. **Integração de Dados**:
   - Mapeie as chaves do objeto `data` (ex: `credor`, `valor`) diretamente nos placeholders do layout.
   - Implemente formatação automática de data (ex: "29 de Abril de 2026") com suporte a override manual.

## Exemplo de Estrutura de Texto

```tsx
<div style={{
  position: "absolute",
  top: 310,
  left: 95,
  fontFamily: "'Times New Roman', serif",
  fontSize: "12pt",
  color: "#000"
}}>
  Credor: <span style={{ fontWeight: 600 }}>{data.credor}</span>
</div>
```

## Validação IDAB

O layout gerado **DEVE** ser compatível com o sistema `validaratestado.digital`. Isso significa que qualquer ajuste de coordenadas no DocMaster deve ser persistido no banco de dados para que o validador público renderize o documento identicamente.
