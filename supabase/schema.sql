-- ============================================================
-- RBW Digital — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query → RUN
--
-- ANTES de rodar: vá em Authentication → Settings e desative
-- "Email Confirm" para que usuários possam entrar sem confirmar.
-- ============================================================

-- 1. Profiles (extende auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null default '',
  email      text not null default '',
  role       text not null default 'viewer'
               check (role in ('admin', 'editor', 'viewer')),
  initials   text default '',
  color      text default '#2D6A4F',
  created_at timestamptz default now()
);

-- 2. Clients
create table if not exists public.clients (
  id           bigserial primary key,
  initials     text default '',
  name         text not null,
  segment      text default '',
  email        text default '',
  status       text default 'Ativo',
  status_color text default 'green',
  tags         text[] default '{}',
  color        text default '#2D6A4F',
  archived     boolean default false,
  created_at   timestamptz default now()
);

-- 3. Tasks
create table if not exists public.tasks (
  id          bigserial primary key,
  title       text not null,
  client      text default '',
  tag         text default '',
  tag_color   text default 'green',
  priority    text default 'Normal',
  date        text default '',
  notes       text default '',
  done        boolean default false,
  task_status text default 'pendente',
  created_by  uuid references auth.users,
  created_at  timestamptz default now()
);

-- 4. Notes
create table if not exists public.notes (
  id         bigserial primary key,
  title      text not null,
  content    text default '',
  project    text default '',
  color      text default 'yellow',
  date       text default '',
  type       text default 'text',
  items      jsonb default '[]',
  pinned     boolean default false,
  created_at timestamptz default now()
);

-- 5. Comments
create table if not exists public.comments (
  id            bigserial primary key,
  task_id       bigint references public.tasks on delete cascade,
  user_id       uuid references auth.users,
  user_name     text default '',
  user_color    text default '#6B6960',
  user_initials text default '',
  text          text not null,
  created_at    timestamptz default now()
);

-- 6. Time Entries
create table if not exists public.time_entries (
  id         bigserial primary key,
  task_id    bigint references public.tasks on delete cascade,
  task_title text default '',
  user_id    uuid references auth.users,
  start_time bigint,
  end_time   bigint,
  duration   bigint default 0
);

-- 7. Notifications (por usuário)
create table if not exists public.notifications (
  id         bigserial primary key,
  user_id    uuid references auth.users on delete cascade,
  icon       text default '🔔',
  message    text not null,
  type       text default 'info',
  read       boolean default false,
  created_at timestamptz default now()
);

-- 8. Activity Log (time compartilhado)
create table if not exists public.activity_log (
  id           bigserial primary key,
  user_id      uuid references auth.users,
  user_name    text default '',
  user_color   text default '#6B6960',
  action       text not null,
  entity_type  text default '',
  entity_title text default '',
  created_at   timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.tasks         enable row level security;
alter table public.notes         enable row level security;
alter table public.comments      enable row level security;
alter table public.time_entries  enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log  enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (true);
create policy "profiles_update" on public.profiles for update to authenticated using (true);

-- Workspace compartilhado
create policy "tasks_all"   on public.tasks   for all to authenticated using (true) with check (true);
create policy "clients_all" on public.clients for all to authenticated using (true) with check (true);
create policy "notes_all"   on public.notes   for all to authenticated using (true) with check (true);

-- Comments
create policy "comments_select" on public.comments for select to authenticated using (true);
create policy "comments_insert" on public.comments for insert to authenticated with check (true);
create policy "comments_delete" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- Time entries
create policy "time_entries_all" on public.time_entries for all to authenticated using (true) with check (true);

-- Notifications (próprias)
create policy "notifications_own" on public.notifications for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activity log
create policy "activity_log_all" on public.activity_log for all to authenticated using (true) with check (true);

-- ============================================================
-- Trigger: cria profile automaticamente ao cadastrar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uname     text;
  uinitials text;
  ucolor    text;
  urole     text;
  colors    text[] := array['#2D6A4F','#5B4FCF','#E07A3A','#D94F3D','#E8A923','#3A7CA5'];
begin
  uname     := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  uinitials := upper(left(uname, 2));
  ucolor    := colors[(floor(random() * 6) + 1)::int];

  if (select count(*) from public.profiles) = 0 then
    urole := 'admin';
  else
    urole := 'viewer';
  end if;

  insert into public.profiles (id, name, email, role, initials, color)
  values (new.id, uname, new.email, urole, uinitials, ucolor)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
