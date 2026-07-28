# Lista administrativa de pedidos

Exibe os pedidos gravados no PostgreSQL e permite avançar o fluxo operacional
por transições de status validadas no servidor.

Consulta um sinal protegido a cada cinco segundos para atualizar lista e
métricas. O alerta usa o MP3 definido em `public/audio/new-order.mp3`, inicia
ativo por padrão, libera a reprodução na primeira interação e toca somente
quando um novo pedido é incluído. O painel oferece volume, teste e silêncio.
