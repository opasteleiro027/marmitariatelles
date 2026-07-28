# Roadmap

## Fundação — concluída

- [x] Next.js, TypeScript e arquitetura modular.
- [x] PostgreSQL/Drizzle, migration e seed idempotente.
- [x] Sessão administrativa deny-by-default.
- [x] Railway standalone, migration pre-deploy e health check.

## Cardápio — essencial concluído

- [x] Criar e editar produtos.
- [x] Ativar/desativar e marcar esgotado.
- [x] Cardápio operacional contínuo e preço histórico em snapshot.
- [ ] Gestão de categorias, fotos e ordenação.
- [ ] Complementos obrigatórios e opcionais.

## Pedido do cliente — essencial concluído

- [x] Carrinho persistente, identificação, retirada/entrega e pagamento.
- [x] Taxa, pedido mínimo, horário e troco.
- [x] Confirmação transacional, estoque e idempotência.
- [x] Sucesso, WhatsApp e acompanhamento por token seguro.
- [x] GPS opcional, busca de CEP e validação do bairro atendido.
- [ ] Observações por item e tela intermediária de revisão detalhada.
- [ ] Consentimento explícito para salvar dados pessoais localmente.

## Operação administrativa — essencial concluído

- [x] Navegação por páginas individuais e responsiva.
- [x] Métricas, listagem e mudança segura de status.
- [x] Cancelamento com devolução de estoque.
- [x] Áreas, taxas, dados públicos e botão de ligar/desligar o site.
- [x] Atualização automática e alerta sonoro opcional para novos pedidos.
- [ ] Busca, filtros, detalhes e nota interna.
- [ ] Comanda, relatórios, gestão de pagamento e aparência.

## Qualidade — em andamento

- [x] Tipos, lint, testes de domínio e build.
- [x] Concorrência e prevenção de duplicidade.
- [ ] Testes de integração com PostgreSQL real.
- [ ] Rate limit distribuído.
- [ ] Auditoria final de acessibilidade e PWA.
