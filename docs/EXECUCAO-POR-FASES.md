# Produção Magazine Cazé — controle de execução

Data do diagnóstico: 27/11/2026. Base: `6c1039cc6860293b2e39786deb10a05dd05f0932`.

## Como avançar

O proprietário pediu execução por fases, com controle entre entregas. Este documento divide a Fase 0 do PROMPT-PRODUCAO.md em etapas menores. Cada etapa termina com relatório, evidências e parada para revisão. A conclusão de uma etapa não autoriza automaticamente a seguinte.

O prompt é o roteiro de requisitos; suas afirmações sobre o estado atual são verificadas no código. Nenhuma configuração comercial, identidade da empresa ou credencial deve ser inventada. Segredos serão configurados nos ambientes, não enviados em chat ou versionados.

## Entrega atual: 0A — diagnóstico

- Repositório clonado do GitHub; nenhuma alteração funcional aplicada.
- Comparação do ZIP: 95 arquivos de texto iguais após normalizar CRLF/LF e quatro imagens idênticas por SHA-256. Única diferença de conteúdo: `.gitignore`. GitHub será a fonte de trabalho.
- Branch local: `codex/plano-producao-fase-0a`.
- O arquivo `RTK.md` referenciado nas instruções não foi encontrado na pasta de trabalho, nos ancestrais consultados, na árvore Documents/Codex ou em .codex. Se houver regras adicionais nesse arquivo, devem ser fornecidas antes da implementação.

### Problemas confirmados

| Prioridade | Evidência | Consequência | Correção planejada |
|---|---|---|---|
| Bloqueante | `src/lib/payments/index.ts` escolhe mock apenas pela ausência do token; rota `api/pedidos/[id]/simular` usa essa mesma condição | Configuração incompleta pode permitir aprovação simulada de pedidos reais | 0B: validar ambiente e impedir mock/simulação em produção |
| Bloqueante | `src/lib/supabase/server.ts` retorna null sem service role; `orders/store.ts` troca para memória | Catálogo real pode coexistir com pedidos voláteis | 0B: rejeitar configuração parcial |
| Alta | Download verifica pedido pago e item, mas não sessão/token adicional | Quem obtiver o UUID de um pedido pago pode acessar a entrega | 0E: autorização, limite atômico e auditoria |
| Alta | `npm audit --omit=dev` retornou dois pacotes com severidade alta e um moderado | Dependências precisam de atualização e regressão | 0B: zod, Next e transitivas; não aplicar correção forçada sem validar |
| Alta | Não há workflow GitHub Actions nem scripts de testes unitários/E2E | Não existe evidência automatizada dos fluxos críticos | 0C: testes, CI e proteção de branch |
| Alta | Sem CSP/HSTS, rate limit ou Turnstile nas implementações inspecionadas | Proteções previstas pelo prompt ainda ausentes | 0D |
| Escala | `repository.ts` lê todos os ativos e filtra/ordena em memória | A consulta não implementa paginação para 5 mil produtos | Fase 1 |

O webhook já rejeita ausência do segredo quando NODE_ENV=production, mas isso não bloqueia build/boot nem o provedor simulado. Preservar essa proteção e testar explicitamente VERCEL_ENV=production.

### Verificações e limites

Resultados da base, sem alterações funcionais:

| Comando | Resultado |
|---|---|
| `npm ci --ignore-scripts` | Passou; instalação reproduzível sem scripts de instalação |
| `npm run lint` | Passou |
| `npx tsc --noEmit` | Passou |
| `npm run build` | Passou; Next 15.5.29, 40 páginas geradas |
| `npm audit --omit=dev` | Falhou: 3 pacotes reportados, 2 altos (zod/PostCSS), 1 moderado (Next por dependência) |
| Unitários/E2E | Não executados: infraestrutura ainda inexistente |

O build emitiu avisos experimentais de localStorage no Node 26.13.1 instalado na máquina. A etapa de CI deverá fixar uma versão suportada do Node e reproduzir os checks nela. Não foram alterados package.json, lockfile, .env.example ou migrações nesta etapa documental.

O diagnóstico não certifica segurança, capacidade de carga ou prontidão para vendas. Supabase remoto, Mercado Pago real e configuração do GitHub/Vercel não foram acessados. A execução de RLS e migrações ainda requer ambiente de banco.

Nesta máquina, Node e npm estão disponíveis; `gh`, Docker e Supabase CLI não foram encontrados no PATH. Não há PR remoto criado nesta etapa. A proteção de branch dependerá de acesso administrativo ao GitHub e da disponibilidade do recurso no repositório.

## Fase 0 — entregas controláveis

| Etapa | Escopo | Evidência para revisão |
|---|---|---|
| 0A — atual | Diagnóstico, comparação das fontes e plano | Este documento e resultados dos comandos |
| 0B — próxima | Atualizar zod; avaliar/migrar Next; fixar versões; Dependabot; validar variáveis públicas/servidor; impedir demo e persistência em memória em produção | Audit, lint, typecheck, build; testes de ambiente completo/incompleto e rejeição do mock; demo local preservado |
| 0C | Testes CPF, parcelas, Pix, frete, CRC e assinatura; E2E Pix/cartão; configuração Supabase local; CI; documentação development/staging/production e migrações | Testes unitários, E2E demo e integração com banco local separados; checks de PR publicados; instrução para tornar checks obrigatórios |
| 0D | CSP/HSTS; rate limit distribuído; Turnstile checkout/cadastro | Testes de bloqueio, erro do provedor, expiração/reuso de CAPTCHA e ausência de quebra do checkout |
| 0E | Download com sessão do comprador ou token curto; limite por item; logs e RLS | Migração nova, testes de acesso cruzado, expiração, concorrência e limite; fluxo convidado definido |
| Fechamento 0 | Revisão conjunta das entregas e pendências externas | Todos os critérios da Fase 0 comprovados; falhas/pendências impedem marcar a fase como pronta |

Em 0B–0E: atualizar README e .env.example conforme necessário; rodar lint, `npx tsc --noEmit`, build e testes pertinentes. Migrações sempre novas e numeradas. Cada entrega deve ter diff revisável e descrição para PR. Não publicar em produção durante essas etapas.

Antes de 0D, confirmar contas de rate limit e Turnstile. Para 0E, optar por sessão autenticada inicialmente ou escolher/configurar provedor de e-mail para tokens de convidado. Tokens não devem ser simplesmente expostos no link público do pedido, pois isso anularia a proteção adicional.

## Fases seguintes do prompt

| Fase | Entrega | Ponto de controle |
|---|---|---|
| 1 | Catálogo, busca, paginação, variações, importação e cache | Dados de teste com 5 mil produtos e medidas reais de desempenho em staging |
| 2 | Checkout, pagamentos, estoque, conciliação, cupons e notificações | Fluxos E2E e corrida de estoque; decidir escopo opcional antes de implementar |
| 3 | Frete, rastreio, fornecedores e devoluções | Provedor logístico e fornecedores reais definidos |
| 4 | Fiscal, dados da empresa, privacidade e direitos do cliente | Contador e revisão jurídica; sem inventar alíquotas ou declarar textos aprovados |
| 5 | Área do aluno, licenças e validade | Comparar plataforma pronta versus própria antes da escolha |
| 6 | Conta, avaliações verificadas, conversão e atendimento | Dados reais e consentimentos testados |
| 7 | Operação administrativa e auditoria | Papéis e ações protegidos; catálogo e pedidos paginados |
| 8 | Infraestrutura, filas, observabilidade e carga | Métricas em staging, custos aprovados e runbooks |
| 9 | SEO, analytics, feeds e domínio | Consentimento, deduplicação e DNS verificados |
| 10 | Acessibilidade, desempenho, qualidade e lançamento | Checklist go-live; transações reais e lançamento somente com decisão do proprietário |

A ordem numérica organiza o trabalho, mas não libera vendas antecipadamente: conforme o prompt, partes de 2, 4 e 8 também bloqueiam a primeira venda. Produtos físicos dependem de 3 e emissão fiscal; campanhas grandes dependem de carga e observabilidade.

## Dados necessários no momento certo

- 0B: nenhuma credencial real necessária para implementar e testar a validação.
- 0C: projetos separados de Supabase para staging/produção e acesso às configurações de CI para finalizar ambientes remotos.
- 0D–0E: contas de proteção e decisão sobre entrega para convidados; e-mail se essa alternativa for escolhida.
- 1: catálogo real e formato de importação, após preparar dados sintéticos.
- 2: política de parcelas/Pix, provedor de e-mail e credenciais sandbox configuradas fora do código.
- 3: logística, origem de envio e fornecedores.
- 4: razão social, CNPJ, endereço, contador, regime e textos aprovados.
- 5: escolha da plataforma de alunos e regras de acesso.
- 8–10: infraestrutura, orçamento, domínio e decisão de lançamento.

## Próximo ponto de controle

Revisar o diagnóstico e autorizar a etapa 0B. A Fase 0 completa permanece pendente; a entrega 0A não modifica o funcionamento da loja.

## Resultado da etapa 0B

Next e Zod atualizados, dependências diretas fixadas, Dependabot configurado e validação de produção ativa. Lint, TypeScript, build e 12 testes de ambiente passaram. Audit de produção zerado. Build e start sem credenciais recusados em produção. Pix e cartão simulados confirmados pela API local. Próxima revisão: 0C.
