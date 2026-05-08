# EliteDoc.store - Análise de Fluxo

## Dashboard (Visão Geral)
- Mostra contador de documentos ativos por tipo (ex: "ATESTADO Ativas: 25")
- Tabela com colunas: NOME | CPF/DOCUMENTO | CRIADO EM | (ações)
- Para atestados, a coluna "CPF/DOCUMENTO" mostra o CÓDIGO QR (ex: XEOM.WR9Q)
- Botões de ação por linha (direita da tabela) - precisam ser investigados
- Busca por Nome ou CPF

## Abas de tipo de documento
CNH | RG | CHA | CRLV | RECIBO (ATPV-e) | ATESTADO | TOXICOLÓGICO | DIPLOMA | HISTÓRICO

## Fluxo a replicar
1. Usuário cria atestado no formulário
2. Clica em EMITIR
3. Pop-up de confirmação aparece
4. Ao clicar "VER HISTÓRICO" → baixa o atestado automaticamente
5. Atestado aparece no dashboard como "criado" com opções editar/excluir/visualizar
