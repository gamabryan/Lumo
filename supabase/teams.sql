-- Lumo: equipes (teams) no workspace + vínculo a projetos
-- Execute no SQL Editor após workspace_members.sql

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- Projeto pode ter uma equipe responsável
alter table public.projects
  add column if not exists team_id uuid references public.teams (id) on delete set null;

create index if not exists idx_teams_workspace_id on public.teams (workspace_id);
create index if not exists idx_team_members_team_id on public.team_members (team_id);
create index if not exists idx_team_members_user_id on public.team_members (user_id);
create index if not exists idx_projects_team_id on public.projects (team_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Teams: membros do workspace podem ver; admins gerenciam
create policy "Workspace members can view teams"
  on public.teams for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace admins can create teams"
  on public.teams for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "Workspace admins can update teams"
  on public.teams for update
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Workspace admins can delete teams"
  on public.teams for delete
  using (public.is_workspace_admin(workspace_id));

-- Team members
create policy "Workspace members can view team members"
  on public.team_members for select
  using (
    exists (
      select 1
      from public.teams t
      where t.id = team_members.team_id
        and public.is_workspace_member(t.workspace_id)
    )
  );

create policy "Workspace admins can add team members"
  on public.team_members for insert
  with check (
    exists (
      select 1
      from public.teams t
      where t.id = team_id
        and public.is_workspace_admin(t.workspace_id)
    )
  );

create policy "Workspace admins can remove team members"
  on public.team_members for delete
  using (
    exists (
      select 1
      from public.teams t
      where t.id = team_members.team_id
        and public.is_workspace_admin(t.workspace_id)
    )
  );

-- Permitir atualizar team_id do projeto por membros do workspace
-- (policies de update em projects já existem via membership)
