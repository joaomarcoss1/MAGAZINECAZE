# Ambientes e migrações

| Ambiente | Supabase | Pagamentos | Uso |
| --- | --- | --- | --- |
| Development | CLI local com Docker | Simulado, sem credenciais do Mercado Pago | Desenvolvimento, testes e dados fictícios |
| Staging | Projeto Supabase separado | Credenciais de teste e endpoint de webhook do ambiente | Homologação de migrações e integrações |
| Production | Projeto Supabase exclusivo | Credenciais de produção e webhook próprio | Vendas reais |

## Desenvolvimento e testes

Com Node 24, Docker em execução e Supabase CLI 2.76.8 no PATH:

```sh
npm ci
supabase start
supabase status
```

Copie .env.example para .env.local. Use a URL local, a chave anon e a chave service_role que a CLI listar. Deixe o Mercado Pago vazio para simulação. O comando supabase db reset recria o banco **local**, aplica migrações e importa o seed. Ele apaga alterações feitas no banco local.

```sh
npm test
npm run lint
npm run build
npx tsc --noEmit
npx playwright install chromium
npm run test:e2e
```

Para testar no navegador com Supabase, exporte também as três variáveis localmente no shell que roda Playwright. Assim o teste pode confirmar que o pagamento gravou o acesso digital. Para rodar o teste inteiramente em memória, remova a configuração Supabase do shell e use um build que não carregue um .env.local com credenciais.

## Promover migrações

1. Adicione uma migração numerada e teste a sequência completa no banco local com supabase db reset.
2. Num checkout isolado, confira a referência do projeto de staging, rode supabase link --project-ref <ref-staging> e supabase db push --dry-run. Revise a lista e aplique com supabase db push. Valide o checkout com as credenciais de teste no deploy de staging.
3. Após a revisão dessa mesma revisão Git e da migração em staging, confirme o backup de produção. Use outro checkout, vincule <ref-production> e revise supabase db push --dry-run antes de aplicar com supabase db push. Preserve migrações já aplicadas. Em caso de correção, crie uma migração subsequente.
4. Defina as variáveis do .env.example separadamente em cada ambiente. Configure o webhook e as URLs de retorno com o domínio do ambiente. O catálogo de exemplo fica restrito aos testes, por isso execute db push sem --include-seed em produção.

## Checks obrigatórios no GitHub

Depois de aprovar a introdução do CI, em Settings → Rules → Rulesets, proteja a branch padrão e exija pull request e os dois checks gerados pelo workflow CI. Selecione os nomes exibidos pelo GitHub, correspondentes a “Lint, types, unitários e checkout demo” e “Checkout com Supabase local”. Confirme em um PR de teste que ambos são obrigatórios antes de tratar o merge como protegido.
