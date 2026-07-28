# Dependências

- Geolocation API do navegador, somente após clique e permissão do cliente.
- BrasilAPI e ViaCEP, em fallback, para consulta de CEP.
- Nominatim/OpenStreetMap para geocodificação reversa iniciada pelo cliente.
- `APP_URL` e `REVERSE_GEOCODING_BASE_URL` para identificação e substituição do
  provedor.

O uso do Nominatim deve permanecer abaixo de uma requisição por segundo, com
atribuição e volume moderado. Para crescimento de uso, substituir o endpoint por
um provedor contratado ou instância própria.
