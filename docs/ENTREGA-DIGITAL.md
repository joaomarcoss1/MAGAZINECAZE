# Entrega digital protegida

Para liberar um arquivo ou redirecionar para um curso, a rota exige sessão, pedido pago, item digital e registro de acesso ativo. Compras feitas em conta só podem ser abertas pelo titular. Quem comprou como convidado deve criar uma conta com o e-mail da compra, confirmar o endereço e abrir Minha conta. A confirmação precisa ter sido enviada pelo Supabase Auth e concluída pelo titular. Para contas antigas criadas com confirmação automática, encaminhe o comprador ao suporte para comprovar a titularidade.

A migração 0002 registra data, usuário e IP quando disponível. A função do banco, exclusiva do servidor, serializa as liberações por item e bloqueia pedidos acima de 10. O limite conta links emitidos, pois o aplicativo não recebe confirmação do fim da transferência. Cada URL assinada do Storage dura dois minutos e pode ser reutilizada nesse intervalo. A plataforma de cursos continua responsável pelo próprio controle de acesso.

Antes de publicar, aplique a migração primeiro em staging e ative a confirmação de e-mail em Supabase Auth. Configure o SMTP e teste o recebimento da mensagem e o acesso à biblioteca. Os dados de auditoria ficam restritos ao servidor. Defina o prazo de retenção dos IPs e o procedimento de atendimento antes de abrir vendas.
