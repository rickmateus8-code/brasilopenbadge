# Plano de Implementação - DocMaster

Este documento detalha todas as tarefas necessárias para atender às solicitações do usuário, categorizadas e estruturadas para execução.

## 1. Dashboard e Layout Geral
- [ ] Remover o item "Histórico" do menu lateral e manter apenas "Atestado" (em `DashboardLayout.tsx`).
- [ ] Adicionar seção "Histórico de emissões" abaixo das Estatísticas no Dashboard, semelhante ao `elitedoc.store` (em `Dashboard.tsx`).
- [ ] Aumentar o tamanho geral do Dashboard em 20% (ajustar CSS/Tailwind no container principal).
- [ ] Alterar a cor primária de Azul para Amarelo em todo o sistema (Dashboard e formulários).
- [ ] Implementar suporte a tema Claro/Escuro baseado no layout do Dashboard.
- [ ] Atualizar os ícones dos documentos para um padrão mais moderno.

## 2. Perfil de Usuário e Configurações
- [ ] Implementar sistema de fotos de perfil (upload e imagens estáticas).
- [ ] Criar menu dropdown ao clicar na foto/nome do usuário com as opções:
  - Configurações
  - Extrato (mover do menu lateral para cá)
  - Ajuda > Suporte
  - Alterar Senha
  - Histórico de recargas
- [ ] Adicionar botão de "Adicionar Saldo (+)" ao lado do valor do saldo.
- [ ] Adicionar Sistema de Avisos e Configurações Gerais do Painel.

## 3. Banco de Dados e Regras de Negócio
- [ ] Implementar regra de exclusão automática de dados criados há mais de 60 dias (CRON job ou verificação na listagem).
- [ ] Adicionar aviso para os clientes no ato de gerar sobre a exclusão em 60 dias.
- [ ] Estruturar o banco de dados para que cada cliente tenha seu próprio "banco de dados" (isolamento por `user_id`).
- [ ] Permitir edição de todos os dados dos documentos pelos clientes.
- [ ] Implementar regra: após a emissão, o CPF deve ser eliminado/ofuscado do formulário.

## 4. Formulários e Emissão de Documentos
- [ ] Aplicar layout universal em todos os formulários de criação, baseado no Dashboard.
- [ ] Implementar regra de slug: cada tipo de documento deve ter uma rota `/nome-do-documento`.
- [ ] Estrutura obrigatória: Formulário + Preview -> Emissão -> Exportação/Download.
- [ ] **REGRA CRÍTICA**: Jamais exibir botões de "Exportar" ou "Baixar" antes que o botão "Confirmar, Emitir" seja clicado.
- [ ] Remover universalmente do projeto os botões de "download" pré-emissão.
- [ ] Melhorar experiência do Atestado:
  - Deixar a área do formulário "mais larga".
  - O preview deve ter o tamanho exato da folha A4.
  - O QR Code no preview antes da emissão deve ser "borrado/desfocado" com filtro, posicionado no local exato.
- [ ] Implementar sistema de Importação do `elitedoc.store` (copiar layout do formulário e manter sistema de preview atual).

## 5. Novos Documentos (Históricos)
- [ ] Extrair e adaptar "Histórico Uninter" do arquivo `DocMasterV8.rar`.
- [ ] Extrair e adaptar "Histórico SP" do arquivo `DocMasterV8.rar`.
- [ ] Adicionar ambos ao projeto usando o layout fixo e universal de formulário.

## 6. Página de Autenticação (Login/Registro)
- [ ] Manter LOGO, LAYOUT VISUAL e CORES da página de login atual.
- [ ] Na página de registro, alterar o texto "Não tem acesso? Solicitar conta" para "Você não tem acesso? Crie sua conta".
- [ ] Remover "© 2026 DocMaster".
- [ ] Verificar e garantir o funcionamento do modo dia/noite.

## 7. Painel Admin (cyberpiolho)
- [ ] Corrigir o erro "Preços > ERRO AO CARREGAR PREÇOS" ("Nenhum preço configurado. Configure via API.").
- [ ] Criar painel Admin completo e interativo.
- [ ] Funções do Admin:
  - Controle de histórico de recargas.
  - Controle de transações geradas.
  - Log de emissões e exclusões.
  - Capacidade de "excluir" banco de dados de usuário específico ou GERAL (com confirmações de segurança).
