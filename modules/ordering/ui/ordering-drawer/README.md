# Carrinho e checkout

Fluxo mobile para revisar produtos, informar cliente, retirada ou entrega,
horário e pagamento antes de confirmar o pedido no servidor.

Na entrega, compõe a peça isolada `address-location-fields`, que oferece GPS
opcional, consulta por CEP, bairro e taxa automáticos e preenchimento manual de
fallback.

Entrega não apresenta seletor de horário; uma faixa disponível é atribuída
internamente. Retirada apresenta o campo “Horário de retirada”.
A entrega só pode ser confirmada quando o endereço corresponde a uma área
cadastrada.
