-- Lumo Storage setup
-- Execute in Supabase SQL Editor after schema.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  10485760, -- 10 MB
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {projectId}/{userId}/{uuid}-{filename}

create policy "Authenticated users can upload project files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Authenticated users can read project files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-files');

create policy "Users can update their project files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can delete their project files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Realtime for file attachments on chat
alter publication supabase_realtime add table public.files;
