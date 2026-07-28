# Rotas do painel

Grupo autenticado que mantém URLs individuais sem alterar o endereço público:

- `/admin`: visão geral;
- `/admin/pedidos`: pedidos e alerta;
- `/admin/cardapio`: produtos;
- `/admin/areas-entrega`: bairros e taxas;
- `/admin/configuracoes`: dados do estabelecimento.

O layout exige a sessão uma vez e cada página consulta somente seus dados.
