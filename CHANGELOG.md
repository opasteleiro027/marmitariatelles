# Changelog

## 0.3.2 - 2026-07-28

### Alterado

- Entrega em casa não solicita mais uma faixa de horário ao cliente.
- O sistema atribui internamente a primeira faixa operacional disponível para
  preservar capacidade e concorrência.
- Retirada continua permitindo a escolha do horário.

## 0.3.1 - 2026-07-28

### Corrigido

- Painel prioriza a agenda de hoje ou a próxima data futura, permitindo editar
  uma agenda de teste já existente.
- Conflito de data duplicada aparece dentro do formulário sem derrubar a página.
- Storefront exibe a data realmente configurada e abre pedidos somente dentro
  da janela publicada dessa agenda.
- Faixas de horário exibidas agora pertencem somente à agenda selecionada.
- Falhas do snapshot público agora registram a causa antes do fallback seguro.

## 0.3.0 - 2026-07-28

### Adicionado

- Botão opcional “Usar minha localização” no checkout.
- Geocodificação reversa com cache, serialização, identificação e atribuição.
- Preenchimento automático de endereço por CEP através do ViaCEP.
- Correspondência automática e validação no servidor da área de entrega.
- Fallback manual e mensagens específicas para permissão negada ou falha.

### Segurança e privacidade

- Coordenadas não são persistidas no pedido.
- GPS só é solicitado após clique e o endereço sugerido permanece editável.

### Corrigido

- Seed de calendário agora reutiliza o menu da data e continua idempotente mesmo
  quando uma data criada anteriormente foi editada pelo administrador.

## 0.2.0 - 2026-07-27

### Adicionado

- Identidade e dados reais da Marmitaria Telles.
- Migração de infraestrutura para Next.js, PostgreSQL, Railway e GitHub.
- Login administrativo interno com cookie seguro.
- Catálogo administrável e controle de esgotado.
- Carrinho persistente e checkout responsivo.
- Confirmação transacional com validação de preço, estoque, área, faixa,
  capacidade, pagamento, troco e idempotência.
- Página de acompanhamento por token seguro.
- Pedidos e métricas reais no painel, histórico de status e cancelamento.
- Gestão de áreas, taxas, dados do estabelecimento e agenda do domingo.
- Migration, seed, health check e empacotamento standalone para Railway.
- Repositório publicado no GitHub e ambiente de produção ativo no Railway com
  PostgreSQL persistente.

### Corrigido

- Data do próximo domingo estabilizada no fuso de São Paulo.
- Texto da página inicial atualizado para refletir o checkout já disponível.

### Pendente

- Fotos, complementos, cupons, filtros detalhados, comanda e relatórios.

## 0.1.0 - 2026-07-27

- Fundação modular inicial, storefront e schema relacional.
