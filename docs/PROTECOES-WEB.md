# Proteções web e configuração

Configure a proteção em staging antes de promover a mesma revisão para produção. Defina APP_ENV=staging no deploy de homologação e use as credenciais de teste de pagamento. A validação exige todas as chaves desta etapa em staging e produção.

1. Crie um Redis Upstash por ambiente. Preencha UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN com o endpoint REST e o token de escrita.
2. Crie um widget Turnstile para cada ambiente. Escolha o modo Invisible e autorize o domínio de NEXT_PUBLIC_SITE_URL. Defina NEXT_PUBLIC_TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY no ambiente.
3. No Supabase de cada ambiente, habilite Turnstile em Authentication → Bot and Abuse Protection e cole o mesmo segredo. O Supabase valida o token de cadastro e login nos endpoints do Auth. Mantenha os limites nativos de Auth ativos para requisições que cheguem diretamente à sua API pública. Cadastre também a URL de callback em Authentication → URL Configuration.
4. Na Vercel, mantenha as variáveis de sistema disponíveis. O limitador usa o IP fornecido por x-vercel-forwarded-for. Fora da Vercel, o proxy de entrada precisa sobrescrever x-real-ip com o IP do cliente e impedir acesso direto à origem. Requisições sem IP válido compartilham um contador.
5. Em staging, abra os formulários e confira que o desafio termina. Envie checkout com Pix sandbox, crie e confirme uma conta, depois faça login. Confirme que os endpoints de autenticação do Supabase exigem CAPTCHA. Revise o console do navegador para possíveis bloqueios da CSP e teste os links de pagamento e download.

O Redis aplica janelas de 60 segundos por IP e operação. Os limites iniciais são 20 no checkout, 120 nas consultas de pedido, 30 em downloads, 15 no login e 8 no cadastro. Ajuste após observar uso, inclusive redes com IP compartilhado. Se o Redis estiver indisponível, as rotas protegidas devolvem 503 para preservar as proteções. O checkout também devolve 503 se Siteverify falhar e 403 se o desafio não for aceito.

A CSP preserva a renderização estática do Next e permite scripts inline usados na hidratação. Ela restringe origens de scripts e conexões, bloqueia objetos e impede que a loja seja embutida em frames. Uma política com nonce exigiria renderização por requisição. O HSTS é enviado em produção, com validade de um ano para o domínio servido.

A demonstração e o CI funcionam sem provedores externos. Os testes unitários simulam respostas do Redis e do Siteverify. A integração das credenciais e a proteção nativa do Supabase precisam de verificação no ambiente de homologação.
