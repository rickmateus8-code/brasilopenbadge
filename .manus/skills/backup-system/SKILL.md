# Skill: Backup Preventivo e Segurança de Deploy

Esta skill estabelece o protocolo obrigatório de backup para o projeto DocMaster, garantindo que qualquer alteração de código ou processo de deploy seja precedido por uma cópia de segurança dos arquivos críticos.

## 🛠️ Protocolo de Backup (Obrigatório)

### 1. Antes de Alterar Arquivos
- **Ação:** Criar uma cópia do arquivo original com a extensão `.bak`.
- **Exemplo:** `cp client/src/pages/Dashboard.tsx client/src/pages/Dashboard.tsx.bak`

### 2. Antes de Realizar Deploy
- **Ação:** Realizar um commit local das alterações estáveis ou criar um diretório de backup temporário do build anterior (`dist_backup`).
- **Comando Sugerido:** `git add . && git commit -m "Pre-deploy backup: [DATA]"`

## 🚨 Regras de Ouro
1. **NUNCA** deletar arquivos `.bak` sem autorização explícita do usuário.
2. **SEMPRE** verificar a integridade do arquivo de backup antes de sobrescrever o original.
3. Em caso de erro crítico no deploy, a restauração deve ser imediata usando os arquivos `.bak` ou o último commit estável citado em `DOCUMENT_RULES.md`.

---
*Assinado: Gemini CLI - Sistema de Backup Automatizado*
