# Limpeza do histórico de testes

Executa a limpeza total dos pedidos de teste em uma única transação protegida.

Antes de excluir os registros, restaura o estoque consumido por pedidos que não
foram cancelados. Em seguida remove notas, históricos de status, pagamentos,
adicionais, itens, chaves de idempotência, pedidos, endereços e clientes.

Cardápio, áreas de entrega, configurações, meios de pagamento e administradores
ficam fora dessa operação.
