-- Lumo MVP Schema
-- Execute this script in the Supabase SQL Editor

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.message_priority_tag as enum ('normal', 'important', 'urgent');

-- Users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar_url text,
  focus_mode_until timestamptz,
  created_at timestamptz not null default now()
);

-- Workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.users (id) on delete set null,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  created_at timestamptz not null default now()
);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  priority_tag public.message_priority_tag not null default 'normal',
  created_at timestamptz not null default now()
);

-- Files (attached to a task and/or a message)
create table public.files (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  name text not null,
  task_id uuid references public.tasks (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  uploaded_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint files_has_parent check (task_id is not null or message_id is not null)
);

-- Indexes
create index idx_workspaces_owner_id on public.workspaces (owner_id);
create index idx_projects_workspace_id on public.projects (workspace_id);
create index idx_tasks_project_id on public.tasks (project_id);
create index idx_tasks_assignee_id on public.tasks (assignee_id);
create index idx_messages_project_id on public.messages (project_id);
create index idx_messages_created_at on public.messages (created_at desc);
create index idx_files_task_id on public.files (task_id);
create index idx_files_message_id on public.files (message_id);

-- Auto-create public.users row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Workspace policies (owner-based for MVP)
create policy "Owners can view their workspaces"
  on public.workspaces for select
  using (auth.uid() = owner_id);

create policy "Owners can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their workspaces"
  on public.workspaces for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete their workspaces"
  on public.workspaces for delete
  using (auth.uid() = owner_id);

-- Project policies (via workspace ownership)
create policy "Members can view projects in owned workspaces"
  on public.projects for select
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = projects.workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can create projects in owned workspaces"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can update projects in owned workspaces"
  on public.projects for update
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = projects.workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can delete projects in owned workspaces"
  on public.projects for delete
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = projects.workspace_id and w.owner_id = auth.uid()
    )
  );

-- Task policies
create policy "Members can view tasks in owned workspaces"
  on public.tasks for select
  using (
    exists (
      select 1
      from public.projects p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = tasks.project_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can create tasks in owned workspaces"
  on public.tasks for insert
  with check (
    exists (
      select 1
      from public.projects p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = project_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can update tasks in owned workspaces"
  on public.tasks for update
  using (
    exists (
      select 1
      from public.projects p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = tasks.project_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can delete tasks in owned workspaces"
  on public.tasks for delete
  using (
    exists (
      select 1
      from public.projects p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = tasks.project_id and w.owner_id = auth.uid()
    )
  );

-- Message policies
create policy "Members can view messages in owned workspaces"
  on public.messages for select
  using (
    exists (
      select 1
      from public.projects p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = messages.project_id and w.owner_id = auth.uid()
    )
  );

create policy "Members can create messages in owned workspaces"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.projects p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = project_id and w.owner_id = auth.uid()
    )
  );

create policy "Senders can update their messages"
  on public.messages for update
  using (auth.uid() = sender_id);

create policy "Senders can delete their messages"
  on public.messages for delete
  using (auth.uid() = sender_id);

-- File policies
create policy "Members can view files in owned workspaces"
  on public.files for select
  using (
    (
      task_id is not null and exists (
        select 1
        from public.tasks t
        join public.projects p on p.id = t.project_id
        join public.workspaces w on w.id = p.workspace_id
        where t.id = files.task_id and w.owner_id = auth.uid()
      )
    )
    or (
      message_id is not null and exists (
        select 1
        from public.messages m
        join public.projects p on p.id = m.project_id
        join public.workspaces w on w.id = p.workspace_id
        where m.id = files.message_id and w.owner_id = auth.uid()
      )
    )
  );

create policy "Members can upload files"
  on public.files for insert
  with check (auth.uid() = uploaded_by);

create policy "Uploaders can delete their files"
  on public.files for delete
  using (auth.uid() = uploaded_by);

-- Realtime (optional for later steps)
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.messages;
