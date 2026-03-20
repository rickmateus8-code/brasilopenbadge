# Regras Internas de Documentos — DocMaster

## 1. Estrutura de Slugs por Tipo de Documento

Cada tipo de documento DEVE ter uma slug dedicada no formato `/xxx`:

| Documento         | Slug Principal     | Componente                  |
|-------------------|--------------------|-----------------------------|
| Atestado Médico   | `/atestado`        | `AtestadoCria.tsx`          |
| CNH Digital       | `/cnh`             | `CNHCria.tsx`               |
| CHA Náutica       | `/cha`             | `CHACria.tsx`               |
| Toxicológico      | `/toxicologico`    | `ToxicologicoCria.tsx`      |
| Histórico SP      | `/historico-sp`    | `HistoricoSP.tsx`           |
| Histórico UNINTER | `/historico-uninter` | `HistoricoUNINTER.tsx`    |

## 2. Modelo Universal de Emissão

Cada documento DEVE seguir o fluxo:

```
Formulário → Preview em Tempo Real → Emissão → Resultado (Exportação/Download)
```

### Etapas:
1. **Formulário**: Campos de entrada de dados do documento
2. **Preview**: Visualização em tempo real do documento (lado direito da tela)
3. **Emissão**: Botão "CONFIRMAR / EMITIR" — único ponto de emissão
4. **Resultado**: Modal de sucesso com código QR e opção de download

## 3. Regras OBRIGATÓRIAS para Botões de Download/Exportar

> ⚠️ **JAMAIS** exibir botões do tipo "EXPORTAR", "BAIXAR", "DOWNLOAD" na slug do formulário ANTES que o botão "CONFIRMAR / EMITIR" seja pressionado.

- Botões de download SOMENTE aparecem após emissão confirmada
- O modal de sucesso pós-emissão PODE ter botão de download
- Páginas de visualização (`/historico/atestados/:id`) PODEM ter botão de download
- A página de validação pública (`/v/:id`) PODE ter botão de download

## 4. Regras de Privacidade e Retenção de Dados

- **CPF**: Apagado do banco de dados imediatamente após emissão (não é armazenado)
- **CNS**: Apagado do banco de dados imediatamente após emissão
- **Retenção**: Documentos são automaticamente excluídos após **60 dias** da emissão
- **Aviso**: O usuário DEVE ser informado sobre a exclusão automática no ato de gerar

## 5. Preview do QR Code (Pré-Emissão)

- O QR Code exibido no preview ANTES da emissão deve ser um modelo **borrado/desfocado**
- Deve ter um filtro visual (`blur`) para indicar que é apenas um placeholder
- O QR Code real é gerado EXCLUSIVAMENTE no servidor após emissão confirmada
- Posicionamento do QR Code borrado deve ser idêntico ao do QR Code real

## 6. Layout Universal de Formulários

Todos os formulários de criação de documentos DEVEM:
- Usar o `DashboardLayout` como base
- Suportar modo escuro/claro (via `ThemeContext`)
- Ter a cor primária amarela (`#f59e0b` / `amber-500`)
- Ter a coluna do formulário com largura mínima de 720px
- Ter o preview em tamanho A4 (794px × 1123px)
- Ter o header com cor amarela

## 7. Adicionando Novos Documentos

Para adicionar um novo tipo de documento:

1. Criar o componente de formulário em `client/src/pages/NomeDocCria.tsx`
2. Criar o componente de visualização em `client/src/pages/NomeDocView.tsx`
3. Adicionar a rota em `client/src/App.tsx` com slug `/nome-doc`
4. Adicionar o item no menu em `client/src/components/DashboardLayout.tsx`
5. Criar o endpoint de API em `functions/api/nome-doc.ts`
6. Adicionar o preço em `document_pricing` no banco D1
7. Seguir TODAS as regras acima

## 8. Segurança Anti-Burla

- QR Code gerado EXCLUSIVAMENTE no servidor
- Código único verificado no banco antes de inserir
- Saldo verificado ANTES de qualquer inserção
- Débito e inserção em operações sequenciais com verificação de integridade
- CPF/CNS apagados após emissão
