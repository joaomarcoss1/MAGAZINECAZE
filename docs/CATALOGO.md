# Catálogo paginado

A listagem filtra, ordena e retorna até 24 produtos por página no Postgres. A página pode ser aberta pela URL com ?pagina=2. No celular, Carregar mais acrescenta a próxima página aos resultados atuais. As recomendações, os destaques e a pré-geração também usam limites explícitos.

A migração 0003 cria um documento de busca gerado a cada alteração do produto. A busca usa o dicionário de português, ignora acentos e mantém a ordenação escolhida. O modo demonstração usa o catálogo local. A divisão do sitemap em arquivos separados e a estratégia de invalidação do cache ficam para a etapa de SEO e desempenho do catálogo.

O CI roda scripts/benchmark-catalog.sql no Supabase local. Ele insere 5 mil produtos fictícios dentro de uma transação, imprime EXPLAIN ANALYZE para listagem e busca e desfaz as inserções. Para repetir em um ambiente descartável, execute com psql -X -v ON_ERROR_STOP=1 -f scripts/benchmark-catalog.sql. Confirme o plano nos logs do CI.

Antes de homologar a fase completa, aplique a migração em staging e meça o p95 das requisições de catálogo e busca com 5 mil produtos. O plano de execução local mede somente a parte de banco. Meça também o LCP da página de produto em 4G.
## Modelo e filtros

A migração 0004 adiciona categorias com subcategorias, SKU, status, data de publicação, metadados de SEO e dados físicos e fiscais. A administração edita SKU, status, agendamento e SEO. A migração cria tabelas com RLS para variações, imagens e atributos. A gestão em lote, upload de imagens e uso das variações no checkout estão previstos nas entregas seguintes. Marcas são opcionais e ficam para uma demanda futura.

Uma categoria inclui os produtos das suas descendentes. As contagens de categoria, formato, preço e atributos são calculadas no Postgres. Cada contagem inclui os demais filtros ativos e simula a opção daquela faceta. A vitrine permite filtrar por um atributo por vez. Preços exibidos nos filtros são limites cumulativos.

Aplique 0004 no Supabase antes do deploy. A rota de entrega usa a chave de serviço para ler o destino depois de verificar o comprador. A API pública e a busca exibem somente os campos do catálogo.
## Imagens do catálogo

Aplique 0005 no Supabase antes de disponibilizar o painel. Abra um produto salvo e use “Enviar imagem”. O upload exige administrador, texto alternativo e JPEG, PNG ou WebP estático de até 2 MB. O servidor limita a resolução de entrada, remove metadados e armazena WebP de até 1.800 px no bucket público produtos. São até 12 imagens por produto, na ordem de envio. Se ainda não houver capa, a primeira imagem se torna a capa.

O Next Image redimensiona as imagens e negocia AVIF ou WebP em ambientes HTTPS. No Supabase local, o navegador usa diretamente o WebP, pois o otimizador bloqueia destinos de rede privada. As imagens do bucket são públicas, inclusive as enviadas para rascunhos. Use apenas conteúdo destinado à vitrine.

O bucket configurado é permitido automaticamente. Para migrar capas externas legadas, defina NEXT_PUBLIC_CATALOG_IMAGE_ORIGINS com as origens HTTPS exatas separadas por vírgula e gere um novo build. URLs fora da lista exibem a capa padrão. Prefira migrar as imagens para o bucket. URLs com parâmetros ou fragmentos não são aceitas.
