# Changelog

## 0.4.0 - 2026-07-28

### Alterado

- O painel agora possui um único controle operacional: **Ligar site** ou
  **Desligar site**.
- Datas, janelas de abertura, publicação e fechamento manual não interferem
  mais na aceitação de pedidos.
- A agenda e seus controles foram removidos do painel administrativo.
- A loja pública mostra somente se o site está ligado ou desligado e não exibe
  mais data ou prazo de encerramento.
- Produtos e carrinho ficam desabilitados enquanto o site estiver desligado.

### Infraestrutura

- Um cardápio operacional interno e estável preserva produtos e faixas de
  retirada sem exigir configuração de agenda pelo administrador.
- Contadores acumulados por data não bloqueiam mais um site que está ligado.
- O servidor revalida o estado ligado/desligado dentro da transação do pedido.

## 0.3.4 - 2026-07-28

### Adicionado

- Administrador pode excluir um bairro cadastrado após uma confirmação
  explícita no painel.
- Exclusão é autorizada e executada no servidor dentro de uma transação.

### Segurança dos dados

- Pedidos históricos preservam endereço e taxa nos snapshots existentes.
- A referência técnica do pedido para a área usa `ON DELETE SET NULL`, permitindo
  remover o bairro operacional sem apagar ou alterar o histórico do pedido.

## 0.3.3 - 2026-07-28

### Alterado

- A busca por CEP preenche o bairro do cliente e identifica automaticamente a
  área e a taxa de entrega correspondentes.
- O checkout não presume mais a primeira área cadastrada nem oferece seleção
  manual de uma taxa diferente do endereço.
- Alterar o CEP ou informar um bairro não atendido limpa a taxa anterior e
  impede a confirmação até existir correspondência com uma área cadastrada.
- O campo Bairro continua editável como alternativa quando o ViaCEP não o
  informar.

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
