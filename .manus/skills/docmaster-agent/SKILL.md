# SKILL.md: Agente DocMaster

**Nome do Skill:** `docmaster-agent`
**Descrição:** Este Skill capacita o agente Manus a compreender e atuar no projeto DocMaster, garantindo a adesão às regras de negócio, padrões técnicos e fluxos de segurança estabelecidos. Ele serve como um guia essencial para desenvolvimento, manutenção e expansão da plataforma.

---

## 1. Visão Geral do Projeto DocMaster

O DocMaster é uma plataforma segura e restrita para emissão e gerenciamento de documentos digitais (Atestados, CNH Digital, CHA Náutica, Exames Toxicológicos e Históricos Escolares). A plataforma foi desenvolvida com foco em **segurança, blindagem contra burlas e responsividade mobile**, com um sistema de emissão atrelado a um saldo financeiro gerenciado pelo Administrador Master.

### Stack Tecnológica
- **Frontend:** React, Vite, TailwindCSS v4, Wouter, Lucide React
- **Backend:** Cloudflare Pages Functions (Serverless APIs)
- **Banco de Dados:** Cloudflare D1 (SQLite Edge)
- **Deploy:** Cloudflare Pages (Automático via GitHub)
- **Domínio Principal:** `docmaster.store`

---

## 2. Princípios Fundamentais e Regras Inegociáveis

As seguintes regras são **CRÍTICAS** para a integridade do DocMaster e **NÃO DEVEM SER ALTERADAS** sem aprovação explícita do usuário:

### 2.1. Segurança do QR Code e Validação
- **Geração:** O QR Code é gerado **EXCLUSIVAMENTE no Backend (Cloudflare Functions)** no momento da emissão, após validação de saldo. Nunca deve ser gerado no frontend ou durante o preenchimento do formulário.
- **Validação Pública:** A página de validação (`/v/:codigo`) consulta **APENAS** o banco D1. Não há fallback para dados locais ou estáticos.
- **Status:** Somente documentos com `status = 'emitido'` são considerados válidos na validação pública.

### 2.2. Sistema de Saldo
- **Emissão:** A emissão de qualquer documento requer saldo positivo, conforme `document_pricing`.
- **Transação Atômica:** O débito do saldo é uma **transação atômica** no backend. Se a inserção do documento falhar, o saldo não é debitado.
- **Administração:** Apenas usuários com `role = 'admin'` podem gerenciar o saldo de outros usuários.

### 2.3. Anti-Indexação e Privacidade
- **Robots:** O projeto utiliza `robots.txt` e meta tags `noindex, nofollow` no `index.html` para **bloquear todos os crawlers**.
- **Terminologia:** Menções a "documentos digitais" ou "plataforma de documentos digitais" foram removidas das páginas públicas (Login/Home) para evitar indexação indevida.

### 2.4. Universalização da Exportação PDF
- A exportação de PDF utiliza a estratégia de **Iframe Sandbox** (`client/src/lib/pdfExport.ts`) para contornar a incompatibilidade do `html2canvas` com `oklch()` do Tailwind v4.
- **NÃO ALTERAR** a lógica de `pdfExport.ts` sem compreender profundamente o problema do `oklch` e suas implicações.
- Sempre utilize o hook `usePDFExport` para novas implementações de exportação.

---

## 3. Componentes Chave e Diretrizes de Desenvolvimento

### 3.1. Frontend (`client/src/`)
- **`App.tsx`:** Roteamento principal e configuração de contextos.
- **`contexts/AuthContext.tsx`:** Gerenciamento de autenticação, saldo e papel do usuário.
- **`contexts/ThemeContext.tsx`:** Gerenciamento do modo claro/escuro.
- **`components/DashboardLayout.tsx`:** Layout principal do painel, incluindo sidebar responsiva e header.
- **`pages/Login.tsx`:** Tela de login com LOGO01 (ícone DM).
- **`pages/Dashboard.tsx`:** Dashboard principal com estatísticas e acesso rápido.
- **`pages/AtestadoCria.tsx`:** Formulário de criação de atestado, com lógica de dias por extenso, CNS/CPF e upload de logo.
- **`lib/pdfExport.ts`:** Lógica universal de exportação PDF (hook `usePDFExport`).
- **`config.ts`:** Configurações globais do projeto.
- **`config.qrcode.ts`:** Configuração do domínio de validação do QR Code (`docmaster.store`).

### 3.2. Backend (`functions/`)
- **`api/auth/`:** Endpoints de autenticação (`login`, `register`, `me`, `logout`).
- **`api/admin/`:** Endpoints para gerenciamento de usuários e saldo pelo admin.
- **`api/attestations.ts`:** Endpoint seguro para emissão de atestados.
- **`api/documents/[[type]].ts`:** Endpoint genérico para outros documentos.
- **`api/transactions/index.ts`:** Endpoint para extrato de transações.
- **`api/validate/[code].ts`:** Endpoint de validação pública do QR Code.
- **`utils/db.ts`:** Conexão com o Cloudflare D1 e helpers de banco de dados.

### 3.3. Banco de Dados (`schema.sql`)
- O `schema.sql` define a estrutura completa do banco D1. Qualquer alteração deve ser cuidadosamente planejada e aplicada via migração (`wrangler d1 execute`).
- **Tabelas Críticas:** `users`, `sessions`, `attestations`, `documents`, `transactions`, `document_pricing`.

---

## 4. Próximos Passos e Melhorias Futuras

Ao atuar neste projeto, priorize as seguintes melhorias:

1. **Implementação Visual dos Novos Documentos:** Desenvolver os layouts visuais detalhados para CNH (`CNHCria.tsx`), CHA (`CHACria.tsx`) e Toxicológico (`ToxicologicoCria.tsx`), espelhando o padrão do docmaster.store.
2. **Integração de Assinatura Digital:** Adicionar funcionalidade para upload de assinaturas com fundo transparente.
3. **Webhook de Pagamento:** Automatizar a recarga de saldo via API de pagamento (ex: Mercado Pago) na página `/recargas`.

---

*Este Skill é um documento vivo. Mantenha-o atualizado com novas diretrizes e aprendizados.*
