-- Lumo: workspace members (execute no SQL Editor se o schema base já foi aplicado)
-- Permite atribuir tarefas a outros usuários do mesmo workspace

create type public.workspace_role as enum ('owner', 'admin', 'member');

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_workspace_id
  on public.workspace_members (workspace_id);
create index if not exists idx_workspace_members_user_id
  on public.workspace_members (user_id);

-- Helper sem recursão de RLS
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
  or exists (
    select 1
    from public.workspaces
    where id = p_workspace_id
      and owner_id = auth.uid()
  );
$$;

-- Busca usuário por email para convite (bypass RLS seletivo)
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
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

-- Ao criar workspace, dono vira membro owner
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- Backfill: donos atuais
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'owner'::public.workspace_role
from public.workspaces w
on conflict (workspace_id, user_id) do nothing;

alter table public.workspace_members enable row level security;

create policy "Members can view workspace memberships"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can add workspace members"
  on public.workspace_members for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update workspace members"
  on public.workspace_members for update
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can remove workspace members"
  on public.workspace_members for delete
  using (
    public.is_workspace_admin(workspace_id)
    and user_id <> auth.uid()
  );

-- Ver perfis de colegas do mesmo workspace
create policy "Users can view co-members profiles"
  on public.users for select
  using (
    exists (
      select 1
      from public.workspace_members me
      join public.workspace_members other
        on other.workspace_id = me.workspace_id
      where me.user_id = auth.uid()
        and other.user_id = users.id
    )
  );

-- Workspaces visíveis para membros (além do owner)
create policy "Members can view workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id));

-- Projetos / tarefas / mensagens / arquivos: acesso via membership
create policy "Workspace members can view projects"
  on public.projects for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can create projects"
  on public.projects for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update projects"
  on public.projects for update
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete projects"
  on public.projects for delete
  using (public.is_workspace_admin(workspace_id));

create policy "Workspace members can view tasks"
  on public.tasks for select
  using (
    exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy "Workspace members can create tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy "Workspace members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy "Workspace members can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy "Workspace members can view messages"
  on public.messages for select
  using (
    exists (
      select 1
      from public.projects p
      where p.id = messages.project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy "Workspace members can create messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );
