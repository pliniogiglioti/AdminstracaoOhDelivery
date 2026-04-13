-- Adiciona colunas para suporte a produtos industrializados com EAN
alter table public.products
  add column if not exists ean text,
  add column if not exists product_type text not null default 'preparado'
    check (product_type in ('preparado', 'industrializado'));

-- Marca como industrializado os produtos que já possuem EAN
update public.products
  set product_type = 'industrializado'
  where ean is not null and product_type = 'preparado';

-- Índice para busca por EAN
create index if not exists products_ean_idx on public.products (ean) where ean is not null;
