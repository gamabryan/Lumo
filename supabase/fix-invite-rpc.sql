-- Fix: RPC de convite de membros (rode no Supabase SQL Editor)
-- Erro típico: Could not find the function public.find_user_for_invite(p_email)

create or replace function public.find_user_for_invite(p_email text)
returns table (
  id uuid,
  name text,
  email text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.name, u.email, u.avatar_url
  from public.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

grant execute on function public.find_user_for_invite(text) to authenticated;

-- Atualiza o cache do PostgREST (opcional; às vezes o Dashboard já faz sozinho)
notify pgrst, 'reload schema';
