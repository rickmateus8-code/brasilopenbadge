# Instruções para Deploy no Cloudflare

Para hospedar este projeto no Cloudflare com o seu domínio `atestado-valide.digital`, siga os passos abaixo:

## 1. Preparação do Projeto
O projeto foi estruturado para ser compatível com **Cloudflare Pages** (Frontend) e uma API separada ou integrada.

### Build do Frontend:
No diretório do projeto, execute:
```bash
pnpm build
```
Isso gerará a pasta `dist`, que contém todos os arquivos estáticos necessários.

## 2. Deploy no Cloudflare Pages (Recomendado)
O Cloudflare Pages é a forma mais fácil de hospedar o frontend React:

1.  Acesse o painel do Cloudflare e vá em **Workers & Pages**.
2.  Clique em **Create application** > **Pages** > **Connect to Git** (ou faça upload direto da pasta `dist`).
3.  **Configurações de Build:**
    *   Framework preset: `Vite`
    *   Build command: `pnpm build`
    *   Build output directory: `dist`
4.  Após o deploy, vá em **Custom domains** e adicione `atestado-valide.digital`.

## 3. Configuração do Backend
Como o projeto utiliza uma API Express em memória para esta versão:

*   **Opção A (Simples):** Mantenha a lógica de dados no frontend (como está no arquivo `client/src/data/attestations.ts`) se não precisar de persistência real em banco de dados agora.
*   **Opção B (Escalável):** Utilize **Cloudflare Workers** para o backend. O arquivo `server/api.ts` pode ser adaptado para rodar em um Worker e usar o **Cloudflare D1** (Banco de dados SQL) ou **KV** para armazenar os atestados.

## 4. Configuração de Domínio no Cloudflare
1.  No painel do Cloudflare, adicione o site `atestado-valide.digital`.
2.  Aponte os NameServers do seu registro de domínio para os fornecidos pelo Cloudflare.
3.  Em **SSL/TLS**, configure como **Full** ou **Full (Strict)**.

---

### O que eu já fiz:
*   ✅ Ajustei o layout para ser 100% responsivo (Mobile/Desktop).
*   ✅ Centralizei os cabeçalhos conforme solicitado.
*   ✅ Aumentei o tamanho do atestado em 25%.
*   ✅ Implementei o suporte a logos dinâmicas via formulário.
*   ✅ Configurei o frontend para apontar para o domínio final.

**Aguardando suas instruções para prosseguir com a vinculação final do domínio!**
