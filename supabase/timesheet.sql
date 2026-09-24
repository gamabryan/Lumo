-- Lumo: timesheet (lançamento de horas)
-- Execute no SQL Editor após teams.sql

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null default 'project'
    check (kind in ('project', 'admin')),
  entry_date date not null,
  hours numeric(5, 2) not null check (hours > 0 and hours <= 24),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_kind_project check (
    (kind = 'project' and project_id is not null)
    or (kind = 'admin' and project_id is null)
  )
);

create unique index if not exists time_entries_project_day_uidx
  on public.time_entries (user_id, project_id, entry_date)
  where kind = 'project';

create unique index if not exists time_entries_admin_day_uidx
  on public.time_entries (user_id, workspace_id, entry_date)
  where kind = 'admin';

create index if not exists idx_time_entries_workspace_user_date
  on public.time_entries (workspace_id, user_id, entry_date);

create index if not exists idx_time_entries_project_id
  on public.time_entries (project_id);

-- Projeto só conta como alocado se tiver equipe e o usuário for membro dela
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

create or replace function public.set_time_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists time_entries_set_updated_at on public.time_entries;
create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row execute function public.set_time_entries_updated_at();

alter table public.time_entries enable row level security;

drop policy if exists "Members can view own time entries" on public.time_entries;
create policy "Members can view own time entries"
  on public.time_entries for select
  using (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

drop policy if exists "Members can create own time entries" on public.time_entries;
create policy "Members can create own time entries"
  on public.time_entries for insert
  with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
    and (
      (
        kind = 'project'
        and project_id is not null
        and public.is_allocated_to_project(project_id)
        and exists (
          select 1
          from public.projects p
          where p.id = project_id
            and p.workspace_id = workspace_id
        )
      )
      or kind = 'admin'
    )
  );

drop policy if exists "Members can update own time entries" on public.time_entries;
create policy "Members can update own time entries"
  on public.time_entries for update
  using (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

drop policy if exists "Members can delete own time entries" on public.time_entries;
create policy "Members can delete own time entries"
  on public.time_entries for delete
  using (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );
