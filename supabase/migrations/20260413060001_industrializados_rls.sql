-- RLS para tabela industrializados: acesso total para admins
alter table public.industrializados enable row level security;

create policy "admin full access industrializados"
  on public.industrializados
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
