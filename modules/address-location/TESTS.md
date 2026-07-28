# Cenários

- rejeita coordenadas fora das faixas válidas;
- remove máscara e valida CEP com oito dígitos;
- converte campos variáveis do OpenStreetMap para o contrato do checkout;
- rejeita localização fora do Brasil;
- compara bairro e cidade ignorando caixa, acentos e prefixos;
- não mantém área ou taxa anterior quando o endereço não tem correspondência;
- mantém preenchimento manual quando GPS, CEP ou provedor falharem;
- exige confirmação manual do número, mas identifica a área automaticamente;
- usa o segundo provedor quando a primeira consulta de CEP falha;
- nunca expõe mensagens técnicas de falha de rede ao cliente.
