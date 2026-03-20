# Análise Completa do Fluxo EliteDoc.store

## 1. FLUXO DE EMISSÃO (atestadocria)

### Botão CONFIRMAR E EMITIR
1. Valida campos obrigatórios (nome do paciente)
2. Exibe pop-up de confirmação: "Confirmar Emissão? Será descontado o valor do saldo." com botões [Sim, Emitir] e [Cancel]
3. Ao confirmar: salva no Supabase (tabela `atestados_emitidos`) + gera PDF + armazena no Supabase Storage
4. Exibe pop-up de sucesso: "Sucesso! Dados salvos e PDF gerado!" com botão [OK]
5. Ao clicar OK: redireciona para o dashboard (/)

## 2. DASHBOARD

### Tabela de atestados (aba ATESTADO)
- Colunas: NOME | CPF/DOCUMENTO (mostra código QR ex: WRNA.PJ9T) | CRIADO EM | Ações
- Botões de ação por linha:
  - 🔒 (cinza) = Edição bloqueada após tempo expirado
  - 📄 (laranja) = Baixar PDF diretamente do Supabase Storage
  - 🗑️ (vermelho) = Deletar atestado

## 3. PÁGINA DE VALIDAÇÃO (atestado-valide.digital)

### Layout
- Header azul (#005ca9): "🛡️ Validador Oficial"
- Card central branco com:
  - Título: "Consultar Documento"
  - Campo: "Código de Autenticação" (placeholder: XXXX-XXXX)
  - Campo: "Data de Emissão" (date picker)
  - Botão verde: "VALIDAR DOCUMENTO"
  - Botão cinza: "LIMPAR"

### Lógica de validação
- Supabase URL: https://ijkzwzvanougkjcxquvn.supabase.co
- Supabase KEY: sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT
- Tabela: `atestados_emitidos`
- Query: `.eq('codigo_validacao', codigo).eq('data_emissao', data)`
- URL params: ?codigo=XXXX&data=YYYY-MM-DD OU /:codigo na URL path

### Após validação bem-sucedida
- Abre modal fullscreen com:
  - Header: nome do paciente + status "DOCUMENTO AUTÊNTICO"
  - Body: renderiza PDF (via PDF.js no mobile, iframe no desktop)
  - Footer: botão "BAIXAR PDF" + botão "FECHAR"

## 4. ESTRUTURA DO BANCO (Supabase - atestados_emitidos)
Campos relevantes:
- `codigo_validacao` - código QR (ex: WRNA.PJ9T)
- `data_emissao` - data no formato YYYY-MM-DD
- `paciente_nome` - nome do paciente
- `arquivo_url` - URL do PDF no Supabase Storage

## 5. O QUE PRECISA SER IMPLEMENTADO NO DOCMASTER

### A. Fluxo de emissão (AtestadoCria.tsx)
- Pop-up de confirmação antes de emitir
- Após confirmar: salvar no D1 + gerar PDF + armazenar
- Pop-up de sucesso com botão "VER HISTÓRICO"
- Ao clicar "VER HISTÓRICO": baixar o PDF automaticamente E redirecionar para dashboard

### B. Dashboard
- Tabela de atestados criados com colunas: NOME | CÓDIGO | DATA | Ações
- Botões: Visualizar (👁️) | Baixar PDF (📄) | Excluir (🗑️)
- Contador de atestados ativos

### C. Página de validação (validaratestado.digital)
- Replicar EXATAMENTE o layout do atestado-valide.digital
- Header azul + card central + campos + botões
- Validar via API do Cloudflare Workers (D1 database)
- Exibir o atestado em modal após validação

### D. QR Code
- Formato URL: https://validaratestado.digital/XXXX.XXXX
- A página de validação deve aceitar o código tanto via URL path (/XXXX.XXXX) quanto via query param (?codigo=XXXX.XXXX)

## 6. MODAL DE VALIDAÇÃO - LAYOUT DETALHADO (após validação bem-sucedida)

O modal ocupa 100% da tela (fullscreen) com:

**Header** (barra branca no topo):
- Esquerda: "✅ VÁLIDO E AUTÊNTICO" (texto verde com ícone de check)
- Direita: Nome do paciente em maiúsculas (ex: "PABULO HENRIQUE DA SILVA SARDINHA")

**Body** (fundo cinza escuro #525659):
- Exibe o PDF do atestado em iframe (desktop) ou canvas PDF.js (mobile)
- PDF renderizado com miniatura lateral esquerda (thumbnail do documento)

**Footer** (barra branca na base):
- Botão esquerdo "FECHAR" (cinza claro, menor)
- Botão direito "⬇ BAIXAR PDF" (azul #005ca9, ocupa o restante da largura)

**Código testado com sucesso:**
- Código: WRNA.PJ9T
- Data: 2026-03-20
- Paciente: PABULO HENRIQUE DA SILVA SARDINHA
- URL: https://atestado-valide.digital/?codigo=WRNA.PJ9T&data=2026-03-20
