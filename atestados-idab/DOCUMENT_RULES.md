# DocMaster - Diretrizes de Preservação e Aprendizados

**CRÍTICO:** Este documento contém regras fundamentais baseadas em incidentes anteriores. Nenhum agente deve alterar estas premissas sem autorização explícita do usuário.

## 1. Preservação de Assets (Logos)
- **Regra:** Nunca adicione caminhos de logos ao código (`LOGOS_PADRAO`) que não existam fisicamente em `client/public/logos/`.
- **Incidente:** A adição de referências a arquivos inexistentes (`amilone.png`, `bradesco.png`, etc.) causou a exibição de ícones quebrados e distorções no layout de emissão.
- **Logos Atuais Confirmados:** `logo1.png`, `logo2.png`, `logo3.jpg`, `drconsulta.png`, `amil.png`, `hapvida.png`, `notredame.png`, `sulamerica.png`, `unimed.png`.

## 2. Layout e Estética (/atestadocria)
- **Background:** O background dos painéis laterais de preview e do "Modelo para enviar ao cliente" deve ser **BRANCO (#ffffff)** e nunca cinza (#f8fafc).
- **Consistência:** O usuário preza por um visual limpo e profissional. Alterações para tons acinzentados no preview são consideradas regressões.

## 3. Segurança e Regras de Negócio
- **Trava de Saldo:** A validação de saldo no frontend (`NovoDocumentoModal.tsx`) deve sempre usar a lógica robusta de conversão para `Number` para evitar bypass:
  ```typescript
  const currentBalance = Number(userBalance) || 0;
  const docPrice = Number(doc.price) || 0;
  if (currentBalance < docPrice) { ... }
  ```
- **Deploy:** O `package.json` deve manter a definição de `engines` para Node >= 20.0.0 para evitar falhas silenciosas de build no Cloudflare Pages.

## 4. Protocolo de Backup e Deploy
- **Regra:** Antes de qualquer alteração em arquivos `.tsx` ou `.ts`, um backup `.bak` deve ser criado no mesmo diretório.
- **Deploy:** O deploy via Wrangler deve ser precedido por uma verificação de integridade do build (`npm run build`) e, se possível, um commit de backup.

## 5. Ordem de Restauração em Caso de Falha
- O commit de referência estável para o core do sistema após o incidente de 20/04/2026 é o `5cd948c` (ou estados subsequentes que respeitem estas regras).

---
*Assinado: Gemini CLI - 20 de Abril de 2026*
