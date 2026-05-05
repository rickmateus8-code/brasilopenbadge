# Roadmap de Evolução: Motor Universal (Engine)

O Motor Universal agora é uma plataforma funcional. As próximas etapas focam em transformar esse motor em uma **Engine Inteligente** capaz de auto-gestão, preenchimento assistido e validação automatizada.

---

## 📅 RoadMap Pós-Etapa 3

### Etapa 4: Engine de Preenchimento Inteligente (Smart-Fill)
*   **Objetivo:** Eliminar o preenchimento manual repetitivo.
*   **Funcionalidades:**
    *   **Auto-Complete por Contexto:** Preencher dados automaticamente baseando-se em histórico anterior do usuário (ex: CPF, OAB, nome do advogado).
    *   **API de Sincronia de Dados:** Permitir que o frontend consulte uma API de "Dicionário de Dados" para sugerir preenchimentos conforme o `fieldId` do template.

### Etapa 5: Engine de Validação e Auditoria (Auto-Integrity)
*   **Objetivo:** Garantir que todo documento emitido esteja sempre em conformidade (paridade 1:1).
*   **Funcionalidades:**
    *   **Check de Layout Automático:** Um script que valida se os elementos do template ainda estão dentro das margens após edições.
    *   **Anti-Fraude de Conteúdo:** O backend validará se os valores preenchidos respeitam as máscaras e regras de negócio definidas no `fields_definition` antes da gravação.

### Etapa 6: Universal Marketplace (Escalabilidade)
*   **Objetivo:** Permitir que administradores criem e compartilhem templates sem deploy.
*   **Funcionalidades:**
    *   Interface de "Upload de Base PDF" para facilitar a criação do layout.
    *   Sistema de versionamento de templates (v1, v2, v3) com rollback nativo no banco de dados.

---

## 🛠️ Iniciando Etapa 4: Engine de Preenchimento

Para darmos continuidade agora, a **Etapa 4** é a mais impactante para o usuário final: **Preenchimento Assistido**.

**Plano Imediato:**
1. Criar um endpoint `/api/engine/suggest/:fieldId` que retorna o histórico recente daquele campo para o usuário logado.
2. Atualizar o `UniversalEmissor.tsx` para exibir um mini-dropdown de sugestões caso o campo tenha dados salvos.

**Podemos iniciar a implementação dessa engine de sugestões (Etapa 4)?**
