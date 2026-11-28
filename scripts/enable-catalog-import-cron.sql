-- Execute no SQL Editor do projeto após aplicar 0006 e habilitar Supabase Cron.
select cron.schedule(
  'magazine-caze-catalog-import',
  '* * * * *',
  'select public.process_catalog_import(1000);'
);
