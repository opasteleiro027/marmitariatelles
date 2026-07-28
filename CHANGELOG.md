# Changelog

## 0.6.0 - 2026-07-28

### Adicionado

- Novo cardápio responsivo inspirado nas telas mobile e desktop fornecidas pelo
  Google Stitch, com hero gastronômico, etapas numeradas e resumo em tempo real.
- Rotas públicas independentes para `/cardapio`, `/como-funciona` e `/contato`.
- Resumo fixo no desktop e barra de continuação fixa no celular.
- Observação geral de até 500 caracteres, persistida no rascunho e gravada no
  snapshot imutável do pedido.
- Imagem gastronômica exportada do projeto Stitch e servida localmente.

### Alterado

- As etapas do montador são geradas automaticamente a partir das categorias
  ativas cadastradas pelo administrador.
- A página inicial agora direciona ao cardápio dedicado e não depende de
  rolagem por âncoras.
- A identidade visual pública usa a paleta Sunday Harvest: laranja queimado,
  verde oliva, branco quente e marrom.
- A ausência de PostgreSQL no desenvolvimento usa preview seguro sem abrir o
  painel de erro do Next.js.

## 0.5.0 - 2026-07-28

### Alterado

- Cada item do menu administrativo possui uma página e uma URL próprias:
  Visão geral, Pedidos, Cardápio, Áreas de entrega e Configurações.
- A navegação não usa mais âncoras nem rolagem para alcançar funcionalidades.
- Cada página consulta somente os dados necessários para sua responsabilidade.
- Áreas de entrega e configurações do estabelecimento foram separadas em
  componentes, consultas e telas independentes.
- O menu destaca a rota ativa e mantém todos os destinos acessíveis no celular.
- A navegação exibe um estado de carregamento entre telas.
- Ações administrativas revalidam suas novas rotas específicas.
- O monitor e o alerta sonoro de novos pedidos permanecem ativos ao navegar
  entre todas as telas do painel.

## 0.4.3 - 2026-07-28

### Alterado

- O alerta de novo pedido usa o toque de telefone enviado pelo restaurante.
- O som inicia habilitado por padrão sempre que o painel é aberto.
- A primeira interação com o painel libera automaticamente a reprodução exigida
  pelo navegador, sem depender de um botão de ativação.
- O administrador pode regular o volume de 0% a 100%, testar o toque e
  silenciar ou reativar o alerta.
- A verificação de pedidos permanece ativa com a aba em segundo plano, sujeita
  ao gerenciamento de energia do navegador.

## 0.4.2 - 2026-07-28

### Corrigido

- A busca por CEP agora usa BrasilAPI e mantém ViaCEP como segundo provedor,
  evitando indisponibilidade quando o Railway não consegue alcançar um deles.
- Falhas de rede, tempo limite e respostas inválidas de CEP ou GPS são
  convertidas em mensagens amigáveis com orientação para preenchimento manual.
- Detalhes técnicos como `fetch failed` não são mais exibidos ao cliente.

## 0.4.1 - 2026-07-28

### Adicionado

- O painel administrativo verifica novos pedidos automaticamente a cada cinco
  segundos e atualiza os dados sem exigir recarregamento manual da página.
- Um endpoint leve, sem dados pessoais e protegido pela sessão administrativa,
  informa quando a lista ou o status dos pedidos mudou.
- O administrador pode ativar ou desativar um alerta sonoro para novos pedidos.
- A ativação reproduz um som de teste para confirmar que o navegador liberou o
  áudio; mudanças de status atualizam o painel sem tocar o alerta.

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
- Faixas de retirada duplicadas por agendas antigas são consolidadas na loja.

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
