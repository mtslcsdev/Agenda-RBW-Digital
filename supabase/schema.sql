-- ============================================================
-- RBW Digital - Supabase Schema
-- Cole este SQL inteiro no Supabase SQL Editor e clique em RUN
-- ============================================================

-- ── PROFILES (estende auth.users) ──────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  initials text,
  color text default '#2D6A4F',
  created_at timestamptz default now()
);

-- ── TASKS ──────────────────────────────────────────────────
create table if not exists public.tasks (
  id bigserial primary key,
  title text not null,
  client text default '',
  tag text default '',
  tag_color text default 'green',
  priority text default 'Normal',
  date text,
  notes text default '',
  done boolean default false,
  task_status text default 'pendente',
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- ── CLIENTS ────────────────────────────────────────────────
create table if not exists public.clients (
  id bigserial primary key,
  initials text,
  name text not null,
  segment text default '',
  email text default '',
  status text default 'Ativo',
  status_color text default 'green',
  tags text[] default '{}',
  color text default '#2D6A4F',
  archived boolean default false,
  created_at timestamptz default now()
);

-- ── NOTES ──────────────────────────────────────────────────
create table if not exists public.notes (
  id bigserial primary key,
  title text not null,
  content text default '',
  project text default '',
  color text default 'yellow',
  date text,
  type text default 'text',
  items jsonb default '[]',
  pinned boolean default false,
  created_at timestamptz default now()
);

-- ── COMMENTS ───────────────────────────────────────────────
create table if not exists public.comments (
  id bigserial primary key,
  task_id bigint references public.tasks on delete cascade,
  user_id uuid references auth.users,
  user_name text,
  user_color text,
  user_initials text,
  text text not null,
  created_at timestamptz default now()
);

-- ── TIME ENTRIES ───────────────────────────────────────────
create table if not exists public.time_entries (
  id bigserial primary key,
  task_id bigint references public.tasks on delete cascade,
  task_title text,
  user_id uuid references auth.users,
  start_time bigint,
  end_time bigint,
  duration bigint
);

-- ── NOTIFICATIONS (por usuário) ────────────────────────────
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid references auth.users,
  icon text,
  message text,
  type text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ── ACTIVITY LOG ───────────────────────────────────────────
create table if not exists public.activity_log (
  id bigserial primary key,
  user_id uuid references auth.users,
  user_name text,
  user_color text,
  action text,
  entity_type text,
  entity_title text,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.clients enable row level security;
alter table public.notes enable row level security;
alter table public.comments enable row level security;
alter table public.time_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;

-- Profiles: todos autenticados podem ler; qualquer um atualiza (role enforcement na app)
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (true);
create policy "profiles_update" on public.profiles for update to authenticated using (true);

-- Tasks: todos autenticados têm acesso total
drop policy if exists "tasks_all" on public.tasks;
create policy "tasks_all" on public.tasks for all to authenticated using (true) with check (true);

-- Clients
drop policy if exists "clients_all" on public.clients;
create policy "clients_all" on public.clients for all to authenticated using (true) with check (true);

-- Notes
drop policy if exists "notes_all" on public.notes;
create policy "notes_all" on public.notes for all to authenticated using (true) with check (true);

-- Comments
drop policy if exists "comments_select" on public.comments;
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_delete" on public.comments;
create policy "comments_select" on public.comments for select to authenticated using (true);
create policy "comments_insert" on public.comments for insert to authenticated with check (true);
create policy "comments_delete" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- Time entries
drop policy if exists "time_entries_all" on public.time_entries;
create policy "time_entries_all" on public.time_entries for all to authenticated using (true) with check (true);

-- Notifications: apenas o próprio usuário
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_select" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert to authenticated with check (true);
create policy "notifications_update" on public.notifications for update to authenticated using (auth.uid() = user_id);

-- Activity log: todos leem, autenticados inserem
drop policy if exists "activity_select" on public.activity_log;
drop policy if exists "activity_insert" on public.activity_log;
create policy "activity_select" on public.activity_log for select to authenticated using (true);
create policy "activity_insert" on public.activity_log for insert to authenticated with check (true);

-- ── TRIGGER: criar profile ao cadastrar usuário ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_count int;
  user_name text;
begin
  select count(*) into user_count from public.profiles;
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  insert into public.profiles (id, name, email, role, initials, color)
  values (
    new.id,
    user_name,
    new.email,
    case when user_count = 0 then 'admin' else 'viewer' end,
    upper(left(user_name, 2)),
    (array['#2D6A4F','#5B4FCF','#E07A3A','#D94F3D','#E8A923','#3A7CA5'])[floor(random()*6)::int + 1]
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── SEED: dados iniciais ────────────────────────────────────
-- Clientes iniciais
insert into public.clients (initials, name, segment, email, status, status_color, color, tags) values
  ('NP', 'Neoprop', 'Trader Training Program', 'robervan@neoprop.com', 'Em andamento', 'orange', '#2D6A4F', '{"GHL","N8N"}'),
  ('CB', 'Cliente B', 'E-commerce / Loja virtual', 'contato@clienteb.com', 'Ativo', 'green', '#5B4FCF', '{"Automação"}'),
  ('MK', 'Cliente C', 'Marketing Digital', 'contato@clientec.com', 'Onboarding', 'yellow', '#E07A3A', '{}')
on conflict do nothing;

-- Tarefas iniciais
insert into public.tasks (title, client, tag, tag_color, priority, date, done, task_status) values
  ('Configurar webhook N8N – Neoprop', 'Neoprop', 'GHL', 'green', 'Normal', '2026-04-07', true, 'concluido'),
  ('Revisar fluxo de aprovação de trader', 'Neoprop', 'N8N', 'orange', 'Alta', '2026-04-08', false, 'em-progresso'),
  ('Switch node – 3 planos Asaas', 'Neoprop', 'N8N', 'orange', 'Urgente', '2026-04-09', false, 'pendente'),
  ('Enviar proposta para novo cliente', 'Pessoal', 'Vendas', 'purple', 'Normal', '2026-04-10', false, 'pendente'),
  ('Reunião com Joy – engajamento de leads', 'Pessoal', 'Reunião', 'yellow', 'Normal', '2026-04-08', false, 'pendente')
on conflict do nothing;

-- Notas iniciais
insert into public.notes (title, content, project, color, date, type, items, pinned) values
  ('🔧 Neoprop – Webhook Rejeição', 'Mapear campo de motivo no webhook de rejeição. Verificar com Robervan a estrutura esperada para o Switch node dos 3 planos.', 'Neoprop', 'yellow', '2026-04-07', 'text', '[]', false),
  ('📊 Meta Ads – Estudo', 'Sessões curtas diárias. Foco atual: estrutura de campanha, conjuntos de anúncios, públicos lookalike e retargeting.', 'Pessoal', 'purple', '2026-04-05', 'text', '[]', false)
on conflict do nothing;

select 'Schema criado com sucesso! ✅' as resultado;
