# Análise do PDF — Receituário Controle Especial

## Layout Geral
- Título: "Receituário Controle Especial" (fonte serif, centralizado, grande)
- 2 páginas idênticas (1ª Via e 2ª Via — Retenção na Farmácia ou Drogaria)

## Estrutura da Página

### Cabeçalho (duas colunas)
- **Coluna esquerda**: Caixa "IDENTIFICAÇÃO DO EMENTE" com:
  - Logo da clínica (dr.consulta)
  - Nome da unidade: "UNIDADE TIJUCA - SUPERMERCADO GUANABARA"
  - CNPJ: 14.245.016/0059-95
  - Endereço: Rua Almirante Cochrane, 146 - Tijuca. Rio de Janeiro/RJ
  - Central de Atendimento: 4090-1510
  - Site: www.drconsulta.com
- **Coluna direita**: 
  - "1/2ª Via — Retenção na Farmácia ou Drogaria"
  - "Data: 14/03/2026"

### Dados do Paciente
- Caixa com borda:
  - "Paciente: PAULO CEZAR RANUCCI"
  - "Endereço: R. Aimoré, 55 - Campina, São Leopoldo - RS, 93130-200"

### Prescrição (área central)
- "1) Uso Interno"
- Nome do medicamento: "Mounjaro (Tirzepatida) - Solução Injetável 7.5mg/0.5ml"
- "Quantidade: 01 (uma) caixa"
- "Uso: Injetar 0.5ml (7.5mg) por via subcutânea uma vez por semana, no mesmo dia da semana, por 4 semanas."
- Área em branco para mais itens

### Rodapé
- **Esquerda**: QR Code grande
- **Direita**: Assinatura cursiva do médico + nome + especialidade + CRM
  - "Dra. Izabella Agnes Borges de Souza"
  - "Psiquiatra"
  - "CRM-RJ: 1160010"
  - Linha para assinatura

### Identificação do Comprador (caixa no rodapé)
- "Nome completo: PAULO CEZAR RANUCCI"
- "Ident. 061.335.329-39"
- "End. completo: R. Aimoré, 55 - Campina, São Leopoldo - RS, 93130-200"
- "Telefone: 48920001902"
- "Cidade: São Leopoldo- RS"
- **Coluna direita**: 3 linhas para assinatura + "Assinatura do Farmacêutico" + "Data ___/___/___"

## Código de Validação
- Formato: RX-XXXX-XXXX (ex: RX-ZYYY-A82N)
- QR Code aponta para: https://verificamed.online/verificar/receita/RX-ZYYY-A82N

## Campos do Formulário de Criação
1. **Médico**: nome, CRM, especialidade, assinatura (busca igual ao atestado)
2. **Instituição**: nome, CNPJ, endereço, telefone, site, logo
3. **Paciente**: nome completo, endereço, identidade, telefone, cidade
4. **Prescrição**: lista de itens (medicamento, quantidade, modo de uso)
5. **Data de emissão**
6. **Tipo de receituário**: Simples / Controle Especial / Antimicrobiano
