# Análise do PDF do Atestado

## Problemas identificados:
1. O rodapé com QR Code está muito baixo - grande espaço vazio entre o corpo e o rodapé
2. O texto do corpo não está com o recuo/espaçamento correto (deve ter indentação de parágrafo)
3. URL de validação ainda aponta para "atestados-idab.pages.dev" em vez de "docmaster.store"
4. O código de validação no rodapé aparece com espaços entre as letras (ex: "N 0 S R . B 1 K 6")
5. O rodapé deve ficar fixo na parte inferior do documento (bottom: 0), não flutuante
6. O conteúdo deve ocupar o espaço entre o header e o rodapé de forma proporcional
7. O texto padrão deve ter indentação de parágrafo (text-indent)
8. O espaçamento entre o header e o corpo precisa ser reduzido

## Layout ideal:
- Header: logos + título ATESTADO MÉDICO
- Corpo: dados do paciente + texto com indentação + CID
- Rodapé FIXO no bottom: cidade/data, URL validação, QR Code, assinatura médico
- Sem espaço vazio excessivo entre corpo e rodapé
