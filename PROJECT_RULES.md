# Regras do projeto

Este arquivo registra a aplicação prática do `RULES.md` fornecido para o
Marmitaria Telles.

1. Organizar por domínio de negócio, nunca por arquivos genéricos.
2. Cada módulo expõe propósito, dependências e cenários de teste.
3. Regras de negócio não dependem de React, PostgreSQL ou APIs de transporte.
4. Valores monetários são inteiros em centavos.
5. Preços, disponibilidade, horário e capacidade são revalidados no servidor.
6. Pedidos históricos usam snapshots imutáveis de nomes e valores.
7. Toda confirmação futura deve ser atômica e idempotente.
8. A administração exige autenticação e autorização no servidor.
9. Documentação, estrutura e changelog mudam junto com o código.
10. Arquivos acima de 300 linhas devem ser avaliados para divisão.
11. Não criar arquivos `utils`, `helpers`, `common`, `shared` ou `misc`.
12. Não declarar uma funcionalidade pronta sem teste ou verificação equivalente.

As instruções do ambiente de execução e as regras de segurança da plataforma
continuam prevalecendo quando houver conflito operacional.
