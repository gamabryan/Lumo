-- Atualiza regra de alocação do timesheet (se timesheet.sql já foi aplicado)
-- Projeto: só membros da equipe vinculada. Admin: todos os membros do workspace.

create or replace function public.is_allocated_to_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.team_members tm on tm.team_id = p.team_id
    where p.id = p_project_id
      and p.team_id is not null
      and tm.user_id = auth.uid()
      and public.is_workspace_member(p.workspace_id)
  );
$$;

grant execute on function public.is_allocated_to_project(uuid) to authenticated;
