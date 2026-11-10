-- Status de presença (rodar no SQL Editor se o schema base já foi aplicado)

do $$ begin
  create type public.presence_status as enum (
    'available',
    'busy',
    'away',
    'offline'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.users
  add column if not exists presence_status public.presence_status not null default 'available';
