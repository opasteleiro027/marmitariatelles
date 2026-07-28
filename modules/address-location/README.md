# Localização e endereço

Converte uma ação explícita do cliente em dados de endereço sem tornar o GPS
obrigatório. Também consulta CEP e identifica a área de entrega correspondente.

## Responsabilidades

- validar e normalizar CEP, coordenadas, cidade e bairro;
- consultar ViaCEP para preencher rua, bairro, cidade e estado;
- identificar automaticamente a área e a taxa a partir de cidade e bairro;
- consultar geocodificação reversa por um adaptador substituível;
- limitar, serializar e armazenar em cache as consultas ao Nominatim;
- manter o endereço sempre editável para confirmação do cliente.

Coordenadas não são persistidas no pedido. O endereço retornado pelo GPS é
aproximado e precisa ser revisado, principalmente número e bairro.
Uma área anterior é descartada sempre que o CEP ou o bairro deixa de
corresponder aos locais atendidos.
