# Lista administrativa de pedidos

Exibe os pedidos gravados no PostgreSQL e permite avançar o fluxo operacional
por transições de status validadas no servidor.

Consulta um sinal protegido a cada cinco segundos para atualizar lista e
métricas. O alerta sonoro é opcional, reproduz um teste ao ser ativado e toca
somente quando um novo pedido é incluído.
