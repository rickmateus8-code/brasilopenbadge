---
name: logo-positioning-engine
description: Sistema de ajuste fino de posicionamento de logos e assets via controles interativos (setas/zoom). Use quando precisar restaurar ou implementar a funcionalidade de enquadramento preciso de logos que devem ser sincronizados com o sistema de validação IDAB.
---

# Logo Positioning Engine

Esta skill gerencia a lógica e a interface de ajuste de assets gráficos (logos/assinaturas) dentro do DocMaster.

## Componentes do Estado

Para cada logo (esquerda/direita), o estado deve conter:
- `scale`: Escala do asset (padrão: 1.0).
- `x`: Deslocamento horizontal (px).
- `y`: Deslocamento vertical (px).

## Implementação da UI (Controles)

Os controles devem permitir ajustes em passos finos:
- **Passo de Escala**: `0.05` por clique.
- **Passo de Posição**: `2px` por clique.

### Layout dos Botões (D-Pad)

```tsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
  <div />
  <button onClick={() => adjustY(side, -2)}>▲</button>
  <div />
  <button onClick={() => adjustX(side, -2)}>◀</button>
  <button onClick={() => reset()}>RESET</button>
  <button onClick={() => adjustX(side, 2)}>▶</button>
  <div />
  <button onClick={() => adjustY(side, 2)}>▼</button>
  <div />
</div>
```

## Sincronização e Persistência

1. **Payload de Emissão**: Os valores de `logoLeftScale/X/Y` e `logoRightScale/X/Y` devem ser incluídos obrigatoriamente no `JSON.stringify(payload)` enviado para `/api/attestations`.
2. **Sincronia IDAB**: O backend deve repassar esses campos para o validador `validaratestado.digital`.
3. **Renderização**: O componente `AttestationDocument` deve aplicar esses valores usando CSS Transform:
   `transform: scale(${scale}) translate(${x}px, ${y}px)`

## Regras de Ouro

- Nunca remova esses controles em refatorações de UI, pois eles quebram a paridade visual da validação.
- O `transformOrigin` deve ser configurado de acordo com o lado: `left center` para o logo esquerdo e `right center` para o direito.
