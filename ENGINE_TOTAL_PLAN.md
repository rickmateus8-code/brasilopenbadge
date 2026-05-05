# Engine Total: Arquitetura de Controle e Automação Admin

Esta arquitetura visa transformar o Admin em uma central de controle absoluta, onde qualquer documento (legado ou universal) é gerido de forma unificada.

## 1. Engine de Sincronia (Real-Time)
Para que alterações reflitam em tempo real, eliminaremos o cache agressivo no frontend:
*   **Cache-Control:** Configurar os headers das requisições de `/api/templates` e `/api/pricing` para `no-cache, no-store, must-revalidate`.
*   **Event-Driven Sync:** Implementar um pequeno mecanismo onde, ao salvar um layout ou preço, o sistema dispara um "trigger" (ou limpa o cache local no cliente) forçando o reload da lista de documentos e preços no Dashboard.

## 2. Unificação de Documentos (O Fim dos Fluxos Isolados)
A Engine tratará todo documento como uma entidade composta por:
*   **Metadata:** (Nome, Preço, Categoria, Visibilidade).
*   **Definition:** (Fields + Layout JSON).
*   **Actions:** (Exportar, Validar, Editar).

## 3. Scripts de Automação (Engine Scripts)
*   `migrate_to_universal.py`: Script para converter documentos legados (ex: Atestado, Receita) para o formato do Motor Universal.
*   `sync_all_templates.sql`: Script de auditoria que garante que todos os documentos no sistema possuem entrada correspondente na `document_templates`.

---

## 🛠️ Próximo Passo: Painel de Controle Centralizado

Para começar, precisamos unificar a interface do Admin para que ele edite *qualquer* documento.

**Plano Imediato:**
1. Criar um `EngineDashboard.tsx` que liste todos os documentos (legados e universais).
2. Criar uma interface única de edição (Preço + JSON de Layout) para qualquer documento.
3. Garantir que as alterações reflitam globalmente via `no-cache` policies.

**Posso prosseguir com a implementação do 'Engine Dashboard' e a unificação da edição?**
