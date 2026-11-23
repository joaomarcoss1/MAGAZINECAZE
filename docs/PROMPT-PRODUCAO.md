# Prompt: levar a Magazine Cazé à produção nacional (5 mil produtos)

> Cole este prompt inteiro em uma sessão do Claude Code (ou de outro agente de código) aberta no repositório `joaomarcoss1/magazinecaze`.
> Ele foi escrito para ser executado em fases. Peça uma fase por vez e revise cada entrega antes de seguir.

---

## Papel e contexto

Você é um(a) engenheiro(a) sênior de e-commerce trabalhando no repositório **Magazine Cazé**, uma loja online brasileira de venda própria (não marketplace) que vende:

- preparatórios para ENEM e concursos;
- cursos profissionalizantes;
- e-books;
- sistemas e licenças de software;
- produtos físicos de dropshipping.

**Meta:** deixar a plataforma pronta para produção, com **5.000 produtos ativos**, vendas para **todo o Brasil**, picos de **centenas de pedidos por minuto** (Black Friday, véspera de ENEM) e operação segura, legal e mensurável.

### Estado atual (já existe — leia antes de mudar)

- **Stack:** Next.js 15.5 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Mercado Pago via API REST, deploy na Vercel.
- **Design system:** tokens em `src/app/globals.css` e guia em `docs/DESIGN.md`. A paleta é Azul Atlântico, Laranja Sol (só para CTAs de compra), Cajá, Mandacaru, Areia, Tinta e Coral. Os componentes ficam em `src/components/ui`.
- **Catálogo:** `src/lib/catalog/repository.ts`. Hoje carrega TODOS os produtos ativos e filtra/ordena em memória. **Isso não escala para 5 mil** e precisa ser reescrito.
- **Pedidos:** `src/lib/orders/store.ts` (Supabase ou memória em modo demo). A confirmação de pagamento é atômica e idempotente pela função SQL `mark_order_paid`.
- **Pagamentos:** `src/lib/payments/`. Pix transparente, cartão via Checkout Pro e webhook com verificação de assinatura `x-signature`. Há um provedor simulado para o modo demo.
- **Entrega digital:** `/api/download/[productId]?pedido=` autoriza pelo UUID do pedido pago. Arquivos vêm de link assinado do bucket privado `digital` (2 min); cursos redirecionam para URL externa.
- **Banco:** `supabase/migrations/0001_init.sql`, com RLS, tabelas `profiles`, `categories`, `products`, `orders`, `order_items` e `entitlements`, e o bucket `digital`.
- **Modo demonstração:** sem variáveis de ambiente, usa `src/lib/catalog/seed.ts` (16 produtos fictícios) e pagamento simulado. **Esse modo deve continuar funcionando para desenvolvimento local**, mas precisa ser impossível de ativar em produção.
- **Admin:** `/admin`, com indicadores, lista de pedidos e CRUD de produtos via server action. Em modo demo fica aberto e somente leitura.
- **Pendências conhecidas:**
  - zod 3 tem vulnerabilidade (migrar para zod 4);
  - o postcss interno do Next aparece no `npm audit`;
  - depoimentos, avaliações e números de vendas são fictícios;
  - os textos legais são rascunhos.

### Regras gerais

1. Preserve a identidade visual e os componentes existentes. Componentes novos devem usar os tokens do design system.
2. **Preços, estoque e totais são sempre calculados no servidor.** Nunca confie no navegador.
3. Toda mudança de banco é uma migração nova e numerada em `supabase/migrations/`, com RLS. Nunca edite migrações já aplicadas.
4. Segredos só em variáveis de ambiente. A `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o cliente.
5. Cada fase termina com:
   - `npm run lint`, `npx tsc --noEmit` e `npm run build` passando;
   - testes da fase passando;
   - README e `.env.example` atualizados;
   - um resumo do que foi feito e do que ficou pendente.
6. Não invente dados reais (CNPJ, depoimentos, avaliações). Deixe campos configuráveis e marque o que o dono precisa preencher.
7. Textos voltados ao cliente em português do Brasil, claros e sem jargão.

---

## FASE 0 — Fundação e segurança (bloqueia todo o resto)

1. **Dependências**
   - Migrar para zod 4 e ajustar `src/lib/validators.ts` e `app/admin/produtos/actions.ts`.
   - Avaliar a atualização para Next.js 16 e resolver os alertas do `npm audit --omit=dev`.
   - Fixar versões exatas no `package.json` e ativar Dependabot/Renovate.
2. **Proteções de produção**
   - Falhar o build/boot em produção (`VERCEL_ENV=production`) se faltar qualquer variável obrigatória. O modo demonstração e o provedor simulado devem ser **impossíveis** em produção.
   - Validar o ambiente com zod em `src/lib/env.ts`, com checagem separada para variáveis de servidor e públicas.
   - Exigir `MERCADOPAGO_WEBHOOK_SECRET` em produção (já é a regra; cobrir com teste).
3. **Ambientes**
   - Criar três ambientes: `development` (Supabase local via CLI), `staging` (projeto Supabase separado e Mercado Pago sandbox) e `production`.
   - Documentar como promover migrações de staging para produção.
4. **CI (GitHub Actions)**
   - Rodar lint, typecheck, testes unitários, build e E2E (Playwright, contra Supabase local) em todo PR.
   - Bloquear o merge se algo falhar.
5. **Testes iniciais**
   - Unitários: `isValidCPF`, `installments`, `pixPrice`, `shippingFor`, `buildBrCode` (CRC) e `verifyMercadoPagoSignature`.
   - E2E do fluxo completo de compra em modo demo, com Pix e cartão.
6. **Segurança web**
   - Content-Security-Policy (permitindo Mercado Pago, Supabase e analytics) e HSTS.
   - Rate limit (Upstash Redis ou Vercel Firewall) em `/api/checkout`, `/api/pedidos/*`, `/api/download/*`, login e cadastro.
   - CAPTCHA invisível (Cloudflare Turnstile) no checkout e no cadastro.
7. **Entrega digital**
   - Hoje o UUID do pedido funciona como token. Exigir **também** sessão do comprador **ou** um token assinado de curta duração enviado por e-mail, com limite de downloads por item (ex.: 10).
   - Registrar cada download (IP, data, usuário) em uma tabela `download_logs`.

**Pronto quando:** o CI está verde, a produção recusa subir sem configuração e os testes cobrem as regras de dinheiro.

---

## FASE 1 — Catálogo para 5.000 produtos

1. **Paginação no banco**
   - Reescrever `repository.ts` para filtrar, ordenar e paginar no Postgres (cursor ou `range`). Nunca carregar o catálogo inteiro.
   - Usar 24 produtos por página, com paginação na URL (`?pagina=`) e "Carregar mais" no mobile.
2. **Busca**
   - Implementar busca textual em português com `tsvector` (dicionário `portuguese` + `unaccent`) e índice GIN.
   - Avaliar Meilisearch ou Typesense para tolerância a erro de digitação, sinônimos (ex.: "concurso" ↔ "edital") e autocomplete no cabeçalho com sugestões e categorias.
   - Sincronizar o índice por trigger/webhook do banco.
3. **Modelo de dados**
   - Categorias hierárquicas (`parent_slug`) e tabela `brands` (opcional).
   - Variações de produtos físicos (tamanho, cor, voltagem) em `product_variants`, com SKU, preço, estoque e peso/dimensões próprios.
   - Múltiplas imagens por produto em `product_images`, com ordem e texto alternativo.
   - Atributos filtráveis em `product_attributes` (ex.: banca, nível, formato, carga horária).
   - Campos de SEO: `seo_title` e `seo_description`.
   - Status `draft` / `active` / `archived` e agendamento de publicação.
   - Para físicos: GTIN/EAN, NCM, peso e dimensões (necessários para frete e nota fiscal).
4. **Filtros facetados** com contagem por faceta (categoria, faixa de preço, formato, atributos), calculada no banco ou no motor de busca.
5. **Imagens**
   - Upload no admin para o Supabase Storage (bucket público `produtos`) com conversão para WebP/AVIF via `next/image`.
   - Limitar `remotePatterns` em `next.config.ts` aos domínios usados (hoje está `**`).
6. **Importação em massa**
   - Importação e exportação por CSV/XLSX no admin, com prévia, validação linha a linha, relatório de erros e processamento em background (fila).
   - Suportar criação e atualização por SKU, imagens por URL e atualização de preço/estoque em lote.
7. **Cache e desempenho**
   - Revalidação por tag (`revalidateTag('product:<id>')`, `'catalog'`) ao salvar no admin, em vez de `revalidatePath('/', 'layout')`.
   - Pré-gerar as páginas dos ~500 produtos mais vendidos; o restante via ISR sob demanda.
   - Sitemap dividido (`generateSitemaps`) em blocos de até 5.000 URLs.
8. **Índices** em `(active, category_slug)`, `(active, sold_count desc)`, `(active, price_cents)`, `(active, created_at desc)` e `(sku)`. Verificar com `EXPLAIN ANALYZE` sobre 5 mil produtos de teste.

**Pronto quando:** um script gera 5.000 produtos fictícios em staging, a listagem e a busca respondem em < 300 ms (p95) no servidor e o LCP da página de produto fica < 2,5 s em 4G.

---

## FASE 2 — Checkout, pagamentos e pedidos robustos

1. **Mercado Pago completo**
   - Cartão transparente com Card Payment Brick (parcelamento, bandeiras, 3DS) mantendo o Checkout Pro como alternativa.
   - Boleto, se o dono quiser (avaliar risco de inadimplência).
   - Juros configuráveis por parcela (sem juros até N vezes).
   - Pix com expiração e cancelamento automático do pedido.
   - Reembolso total e parcial pelo admin, via API.
   - Tratar chargeback e estorno no webhook (`refunded`, `charged_back`), revogando o acesso digital.
2. **Redundância de gateway** (opcional, recomendado): abstração já existe em `PaymentProvider`. Adicionar um segundo provedor (Pagar.me ou Asaas) com troca por configuração.
3. **Reconciliação**
   - Job agendado (Vercel Cron) a cada 10 min que consulta pagamentos `pending` há mais de 5 min no Mercado Pago, para cobrir webhooks perdidos.
   - Job diário que expira pedidos Pix vencidos.
4. **Estoque**
   - Reservar estoque ao criar o pedido (tabela `stock_reservations` com expiração) e liberar ao expirar ou cancelar.
   - Usar `UPDATE ... WHERE stock >= qty` para evitar venda acima do estoque em pico.
5. **Idempotência do checkout**
   - Chave de idempotência enviada pelo cliente: duplo clique não pode gerar dois pedidos.
   - O botão de pagar fica bloqueado até a resposta.
6. **Cupons e promoções**
   - Tabela `coupons` com percentual ou valor fixo, mínimo do pedido, validade, limite de uso total e por CPF, e restrição por categoria/produto.
   - Preço promocional com data de início e fim.
   - Kits/combos de produtos.
7. **Carrinho no servidor** para usuários logados (sincroniza com o localStorage), permitindo recuperação de carrinho.
8. **Checkout**
   - Login opcional com "comprar como convidado".
   - Autopreenchimento para clientes que voltam.
   - Validação de e-mail com sugestão de domínio ("gmal.com" → "gmail.com").
   - Busca de CEP por rota própria `/api/cep`, com cache e fallback (ViaCEP + BrasilAPI), em vez de chamar o ViaCEP direto do navegador.
9. **Antifraude:** usar o antifraude do Mercado Pago (enviar `additional_info` com itens, comprador e endereço), mais regras próprias: limite de tentativas por CPF/cartão/IP e bloqueio de e-mails descartáveis.
10. **Notificações**
    - E-mails transacionais (Resend ou Amazon SES), em templates React Email com a identidade visual:
      - pedido criado (com Pix copia e cola);
      - pagamento aprovado (com links de acesso);
      - pedido enviado (com rastreio);
      - reembolso.
    - WhatsApp (API oficial da Meta ou um BSP) para Pix pendente e envio.
    - Envio por fila (nunca dentro do webhook síncrono).

**Pronto quando:** E2E cobrem Pix aprovado, Pix expirado, cartão recusado, reembolso, cupom e esgotamento de estoque concorrente (teste de corrida com 50 compras simultâneas do último item).

---

## FASE 3 — Logística nacional (produtos físicos e dropshipping)

1. **Frete por CEP** com Melhor Envio (ou Frenet): cotação em tempo real na página de produto e no carrinho, opções PAC, SEDEX e transportadoras, com prazo e preço.
   - Regras de frete grátis por região/valor configuráveis no admin.
   - Cache das cotações.
2. **Etiquetas e rastreio:** gerar a etiqueta pelo admin, salvar o código de rastreio, mostrar a linha do tempo na página do pedido e notificar o cliente a cada mudança (webhook do Melhor Envio).
3. **Dropshipping**
   - Cadastro de fornecedores (`suppliers`) com custo, prazo de postagem e margem.
   - Repasse automático do pedido ao fornecedor (API, e-mail ou planilha, conforme o fornecedor).
   - Status por item e alerta de atraso.
4. **Estados de pedido físico:** `pago → em separação → enviado → entregue` (e `devolvido`), com histórico em `order_events`.
5. **Trocas e devoluções:** solicitação pelo cliente em "Minha conta" dentro de 7 dias, geração de etiqueta reversa e reembolso após recebimento.

---

## FASE 4 — Fiscal e legal (Brasil)

1. **Nota fiscal automática** via Focus NFe, eNotas ou NFE.io:
   - NFS-e para cursos, serviços e licenças; NF-e para produtos físicos.
   - Emissão após o pagamento aprovado, PDF/XML enviados ao cliente e disponíveis em "Minha conta", cancelamento no reembolso.
   - Configuração tributária (regime, alíquotas e NCM/CFOP por produto) definida com o contador do dono — **não invente valores**.
2. **CDC e decreto do e-commerce (Decreto 7.962/2013):**
   - dados da empresa (razão social, CNPJ e endereço) no rodapé;
   - resumo do pedido antes de pagar;
   - canal de atendimento;
   - direito de arrependimento em 7 dias com botão de cancelamento fácil.
3. **LGPD**
   - Banner de consentimento de cookies (analytics e marketing só após consentimento).
   - Política de privacidade revisada.
   - Área "Meus dados" para exportar e excluir a conta (anonimizando pedidos que precisam ser guardados por obrigação fiscal).
   - Registro de consentimentos.
   - Nomear o encarregado (DPO) na política.
4. **Proteção de conteúdo digital:** marca d'água nos PDFs com nome, CPF parcial e e-mail do comprador (gerada no download, com cache por pedido). Os termos de uso devem proibir o compartilhamento.
5. **Revisão jurídica** de termos, privacidade e trocas: deixe um checklist em `docs/` para o advogado e não publique textos como definitivos.

---

## FASE 5 — Área do aluno e produtos digitais

1. **Escolher entre:**
   - (a) integrar uma plataforma pronta (Memberkit, Cademí, Hotmart Club) por API/webhook, liberando o acesso automaticamente; ou
   - (b) construir área de membros própria: módulos, aulas, progresso e certificado em PDF, com vídeos hospedados em Panda Video ou Bunny Stream (DRM/token e domínio restrito).

   Recomende uma opção com prós e contras antes de implementar.
2. **Acesso com validade** (ex.: 12 meses) em `entitlements.expires_at`, com aviso de expiração e renovação com desconto.
3. **Licenças de software:** geração de chaves únicas por pedido (tabela `license_keys`), ativação e limite de dispositivos (se aplicável).
4. **Assinaturas** (opcional): planos mensais/anuais com cobrança recorrente via Mercado Pago Assinaturas.

---

## FASE 6 — Conta do cliente, confiança e conversão

1. **Conta**
   - Login com Google e por link mágico.
   - Recuperação de senha.
   - Endereços salvos.
   - Lista de desejos.
   - Histórico de pedidos com rastreio e notas fiscais.
2. **Avaliações reais:** apenas compradores verificados avaliam, com moderação no admin, fotos opcionais e resposta da loja. Recalcular `rating`/`reviews_count` por trigger e remover os números fictícios do seed.
3. **Página de produto**
   - Galeria de imagens, vídeo de apresentação e perguntas frequentes por produto.
   - Selo "comprado X vezes nas últimas 24h" (com dados reais).
   - Bloco "compre junto".
4. **Recomendações:** "quem comprou também comprou" baseado em co-ocorrência de pedidos (view materializada atualizada diariamente).
5. **Recuperação de vendas:** carrinho abandonado (e-mail/WhatsApp após 1h e 24h, com consentimento) e Pix não pago (lembrete antes de expirar).
6. **Afiliados:** links com código, cookie de 30 dias, comissão por produto, painel do afiliado e relatório para pagamento.
7. **Atendimento:** botão de WhatsApp com mensagem pré-preenchida com o número do pedido, central de ajuda com FAQ pesquisável e (opcional) chat.

---

## FASE 7 — Admin para operar 5 mil produtos

1. **Papéis:** `admin`, `operador` (pedidos e envios), `conteudo` (catálogo) e `financeiro`, com RLS e checagem em cada server action.
2. **Produtos**
   - Tabela com busca, filtros, paginação e edição em lote (preço, status, categoria).
   - Duplicar produto, histórico de alterações e prévia antes de publicar.
3. **Pedidos**
   - Filtros por status, método e período; busca por número, e-mail ou CPF.
   - Detalhe com linha do tempo; ações de reembolsar, reenviar acesso, gerar etiqueta e emitir/cancelar nota.
   - Exportação CSV.
4. **Relatórios:** faturamento por dia/categoria/produto, ticket médio, conversão, uso de cupons, origem do tráfego (UTM), reembolsos e margem (com custo do produto).
5. **Clientes:** lista, histórico, bloqueio e notas internas.
6. **Auditoria:** tabela `audit_log` com quem mudou o quê e quando, para todas as ações do admin.

---

## FASE 8 — Escala, infraestrutura e observabilidade

1. **Banco**
   - Supabase no plano Pro (ou superior), com backups diários e PITR.
   - Pooler de conexões (Supavisor, modo transação) nas funções serverless.
   - Réplica de leitura se necessário.
   - Monitorar consultas lentas.
2. **Região:** avaliar mover funções e banco para `gru1` / São Paulo (Vercel e Supabase `sa-east-1`) para reduzir a latência no Brasil. Hoje o deploy está em `iad1`.
3. **Filas e jobs:** fila durável (Inngest, Trigger.dev, QStash ou Supabase Queues) para e-mails, notas fiscais, repasse ao fornecedor, indexação de busca e importações. Webhooks só enfileiram e respondem rápido.
4. **Cache:** CDN da Vercel para páginas e imagens, e Redis (Upstash) para cotações de frete, CEP, rate limit e contadores.
5. **Teste de carga** com k6 ou Artillery em staging:
   - cenário de 300 pedidos/minuto e 5 mil usuários simultâneos navegando;
   - pico de webhooks;
   - medir p95, taxa de erro e conexões no banco;
   - corrigir gargalos.
6. **Observabilidade**
   - Sentry (erros no front e no back, com source maps).
   - Logs estruturados com o id do pedido em todo o fluxo de pagamento.
   - Vercel Analytics / Speed Insights.
   - Alertas para: taxa de erro do checkout, webhook falhando, fila acumulando, pedidos pagos sem nota emitida e queda de conversão.
   - Página de status interna.
7. **Recuperação de desastre:** runbook em `docs/runbooks/` para gateway fora do ar, banco indisponível, webhook parado, vazamento de chave e rollback de deploy.

---

## FASE 9 — SEO, marketing e analytics

1. **SEO**
   - Metadados únicos por produto/categoria e imagens Open Graph geradas (`opengraph-image.tsx`) com a capa do produto.
   - Dados estruturados `Product`, `Offer`, `BreadcrumbList`, `FAQPage` e `Organization`.
   - Canonical em listagens filtradas.
   - Páginas de categoria com texto editorial.
   - Blog/conteúdo para termos de busca (ENEM, concursos do Nordeste).
2. **Analytics:** GA4 e Meta Pixel com Conversions API (no servidor, após o pagamento aprovado, com deduplicação), TikTok Pixel e eventos de funil (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`), respeitando o consentimento LGPD.
3. **Feeds:** feed de produtos para Google Merchant Center e catálogo da Meta, gerado automaticamente (`/feeds/google.xml`).
4. **Domínio próprio** (ex.: magazinecaze.com.br) na Vercel, com e-mail no domínio (SPF, DKIM e DMARC configurados para os e-mails transacionais não caírem no spam).

---

## FASE 10 — Qualidade e lançamento

1. **Acessibilidade:** auditoria WCAG 2.2 AA (contraste dos tokens, foco visível, navegação por teclado no checkout, rótulos, `aria-live` na atualização do Pix).
2. **Desempenho:** Lighthouse ≥ 90 em mobile na home, categoria, produto e checkout; orçamento de JS por rota.
3. **Testes:**
   - cobertura das regras de negócio ≥ 80%;
   - E2E dos fluxos críticos em Chromium e WebKit mobile;
   - testes de RLS (um cliente não pode ler pedido de outro).
4. **Checklist de go-live** em `docs/GO-LIVE.md`:
   - credenciais de produção;
   - webhook cadastrado e testado com um pagamento real de baixo valor;
   - reembolso real testado;
   - nota fiscal emitida em produção;
   - backups conferidos;
   - alertas recebidos;
   - textos legais aprovados;
   - catálogo real importado e dados de exemplo removidos;
   - DNS e e-mail verificados.
5. **Lançamento gradual:** soft launch para uma lista pequena, monitorar 72h e depois abrir para o público.

---

## Ordem recomendada e entregáveis

| Prioridade | Fases | Resultado |
|---|---|---|
| Obrigatório antes da 1ª venda real | 0, 2 (itens 1, 3, 4, 5, 10), 4 (itens 2–3), 8 (itens 1, 6) | Vender com segurança e dentro da lei |
| Obrigatório para 5 mil produtos | 1, 7 (itens 1–3) | Catálogo e operação em escala |
| Obrigatório para físicos/nacional | 3, 4 (item 1) | Frete, rastreio e nota fiscal |
| Crescimento | 5, 6, 9 | Conversão, recorrência e aquisição |
| Antes de campanhas grandes | 8 (itens 3–5), 10 | Aguenta picos e é monitorado |

Para **cada fase**, entregue:
- PR com descrição;
- migrações;
- testes;
- variáveis novas no `.env.example`;
- documentação atualizada;
- lista do que o dono precisa fazer fora do código (contas, contratos, credenciais, textos).

### Informações que você deve pedir ao dono antes de começar (não invente)

- Razão social, CNPJ, endereço, regime tributário e contador responsável.
- Contas e credenciais (para colocar nas variáveis de ambiente, nunca no código): Supabase, Mercado Pago, provedor de e-mail, emissor de nota fiscal, Melhor Envio, WhatsApp Business, domínio.
- Política comercial: parcelas sem juros, desconto no Pix, regras de frete grátis, prazo de acesso aos cursos e política de reembolso.
- Plataforma de área do aluno escolhida (ou se ela será construída).
- Lista de fornecedores de dropshipping e como cada um recebe pedidos.
- Planilha com o catálogo real (ou origem dos dados) para a importação.
