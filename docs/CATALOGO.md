# Catálogo paginado

A listagem filtra, ordena e retorna até 24 produtos por página no Postgres. A página pode ser aberta pela URL com ?pagina=2. No celular, Carregar mais acrescenta a próxima página aos resultados atuais. As recomendações, os destaques e a pré-geração também usam limites explícitos.

A migração 0003 cria um documento de busca gerado a cada alteração do produto. A busca usa o dicionário de português, ignora acentos e mantém a ordenação escolhida. O modo demonstração usa o catálogo local. A divisão do sitemap em arquivos separados e a estratégia de invalidação do cache ficam para a etapa de SEO e desempenho do catálogo.

O CI roda scripts/benchmark-catalog.sql no Supabase local. Ele insere 5 mil produtos fictícios dentro de uma transação, imprime EXPLAIN ANALYZE para listagem e busca e desfaz as inserções. Para repetir em um ambiente descartável, execute com psql -X -v ON_ERROR_STOP=1 -f scripts/benchmark-catalog.sql. Confirme o plano nos logs do CI.

Antes de homologar a fase completa, aplique a migração em staging e meça o p95 das requisições de catálogo e busca com 5 mil produtos. O plano de execução local mede somente a parte de banco. Meça também o LCP da página de produto em 4G.
