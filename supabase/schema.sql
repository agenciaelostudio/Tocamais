create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'fan' check (role in ('admin', 'bar_owner', 'artist', 'fan')),
  avatar_url text,
  bio text,
  phone text,
  city text,
  state text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  user_email text not null,
  stage_name text not null,
  bio text,
  avatar_url text,
  cover_url text,
  genres text[] not null default '{}',
  performance_types text[] not null default '{}',
  base_price numeric not null default 0,
  city text,
  state text,
  avg_rating numeric not null default 0,
  total_reviews integer not null default 0,
  total_tips numeric not null default 0,
  available_days text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null default '',
  description text,
  address text,
  city text,
  state text,
  photo_url text,
  capacity integer not null default 0,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues (id) on delete cascade,
  venue_name text,
  artist_profile_id uuid references public.artist_profiles (id) on delete cascade,
  artist_name text,
  artist_email text,
  bar_owner_email text,
  event_date date not null,
  start_time text,
  end_time text,
  offered_price numeric not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  artist_response text,
  performance_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals (id) on delete set null,
  venue_id uuid references public.venues (id) on delete set null,
  venue_name text,
  artist_profile_id uuid references public.artist_profiles (id) on delete set null,
  artist_name text,
  artist_email text,
  bar_owner_email text,
  event_date date not null,
  start_time text,
  end_time text,
  price numeric,
  performance_type text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  fan_email text not null,
  artist_profile_id uuid references public.artist_profiles (id) on delete cascade,
  artist_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  title text not null,
  message text not null,
  type text not null default 'system' check (type in ('proposal', 'tip', 'review', 'event', 'system')),
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  artist_profile_id uuid references public.artist_profiles (id) on delete cascade,
  fan_email text not null,
  fan_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  artist_profile_id uuid references public.artist_profiles (id) on delete cascade,
  artist_email text,
  fan_email text not null,
  fan_name text,
  amount numeric not null,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals (id) on delete cascade,
  sender_email text not null,
  sender_name text,
  receiver_email text not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_artist_profiles_user_email on public.artist_profiles (user_email);
create index if not exists idx_venues_owner_email on public.venues (owner_email);
create index if not exists idx_proposals_artist_email on public.proposals (artist_email);
create index if not exists idx_proposals_bar_owner_email on public.proposals (bar_owner_email);
create index if not exists idx_events_artist_email on public.events (artist_email);
create index if not exists idx_events_bar_owner_email on public.events (bar_owner_email);
create index if not exists idx_favorites_fan_email on public.favorites (fan_email);
create index if not exists idx_notifications_user_email on public.notifications (user_email);
create index if not exists idx_reviews_artist_profile_id on public.reviews (artist_profile_id);
create index if not exists idx_tips_artist_email on public.tips (artist_email);
create index if not exists idx_chat_messages_proposal_id on public.chat_messages (proposal_id);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_artist_profiles_updated_at on public.artist_profiles;
create trigger set_artist_profiles_updated_at
before update on public.artist_profiles
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_venues_updated_at on public.venues;
create trigger set_venues_updated_at
before update on public.venues
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_proposals_updated_at on public.proposals;
create trigger set_proposals_updated_at
before update on public.proposals
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_favorites_updated_at on public.favorites;
create trigger set_favorites_updated_at
before update on public.favorites
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_tips_updated_at on public.tips;
create trigger set_tips_updated_at
before update on public.tips
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
before update on public.chat_messages
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    bio,
    phone,
    city,
    state,
    onboarding_complete
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'fan'),
    new.raw_user_meta_data ->> 'bio',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'state',
    coalesce((new.raw_user_meta_data ->> 'onboarding_complete')::boolean, false)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    bio = excluded.bio,
    phone = excluded.phone,
    city = excluded.city,
    state = excluded.state,
    onboarding_complete = excluded.onboarding_complete;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.venues enable row level security;
alter table public.proposals enable row level security;
alter table public.events enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.tips enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "artist_profiles_public_read" on public.artist_profiles;
create policy "artist_profiles_public_read"
on public.artist_profiles for select
to anon, authenticated
using (true);

drop policy if exists "artist_profiles_manage_own" on public.artist_profiles;
create policy "artist_profiles_manage_own"
on public.artist_profiles for all
to authenticated
using (user_email = (select auth.jwt() ->> 'email'))
with check (user_email = (select auth.jwt() ->> 'email'));

drop policy if exists "venues_authenticated_read" on public.venues;
create policy "venues_authenticated_read"
on public.venues for select
to authenticated
using (true);

drop policy if exists "venues_manage_own" on public.venues;
create policy "venues_manage_own"
on public.venues for all
to authenticated
using (owner_email = (select auth.jwt() ->> 'email'))
with check (owner_email = (select auth.jwt() ->> 'email'));

drop policy if exists "proposals_participants_read" on public.proposals;
create policy "proposals_participants_read"
on public.proposals for select
to authenticated
using (
  artist_email = (select auth.jwt() ->> 'email')
  or bar_owner_email = (select auth.jwt() ->> 'email')
);

drop policy if exists "proposals_participants_manage" on public.proposals;
create policy "proposals_participants_manage"
on public.proposals for all
to authenticated
using (
  artist_email = (select auth.jwt() ->> 'email')
  or bar_owner_email = (select auth.jwt() ->> 'email')
)
with check (
  artist_email = (select auth.jwt() ->> 'email')
  or bar_owner_email = (select auth.jwt() ->> 'email')
);

drop policy if exists "events_public_read" on public.events;
create policy "events_public_read"
on public.events for select
to anon, authenticated
using (true);

drop policy if exists "events_participants_manage" on public.events;
create policy "events_participants_manage"
on public.events for all
to authenticated
using (
  artist_email = (select auth.jwt() ->> 'email')
  or bar_owner_email = (select auth.jwt() ->> 'email')
)
with check (
  artist_email = (select auth.jwt() ->> 'email')
  or bar_owner_email = (select auth.jwt() ->> 'email')
);

drop policy if exists "favorites_manage_own" on public.favorites;
create policy "favorites_manage_own"
on public.favorites for all
to authenticated
using (fan_email = (select auth.jwt() ->> 'email'))
with check (fan_email = (select auth.jwt() ->> 'email'));

drop policy if exists "notifications_manage_own" on public.notifications;
create policy "notifications_manage_own"
on public.notifications for all
to authenticated
using (user_email = (select auth.jwt() ->> 'email'))
with check (user_email = (select auth.jwt() ->> 'email'));

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
on public.reviews for select
to anon, authenticated
using (true);

drop policy if exists "reviews_manage_own" on public.reviews;
create policy "reviews_manage_own"
on public.reviews for all
to authenticated
using (fan_email = (select auth.jwt() ->> 'email'))
with check (fan_email = (select auth.jwt() ->> 'email'));

drop policy if exists "tips_public_read_authenticated" on public.tips;
create policy "tips_public_read_authenticated"
on public.tips for select
to authenticated
using (true);

drop policy if exists "tips_manage_own" on public.tips;
create policy "tips_manage_own"
on public.tips for all
to authenticated
using (
  fan_email = (select auth.jwt() ->> 'email')
  or artist_email = (select auth.jwt() ->> 'email')
)
with check (
  fan_email = (select auth.jwt() ->> 'email')
  or artist_email = (select auth.jwt() ->> 'email')
);

drop policy if exists "chat_messages_participants_manage" on public.chat_messages;
create policy "chat_messages_participants_manage"
on public.chat_messages for all
to authenticated
using (
  sender_email = (select auth.jwt() ->> 'email')
  or receiver_email = (select auth.jwt() ->> 'email')
)
with check (
  sender_email = (select auth.jwt() ->> 'email')
  or receiver_email = (select auth.jwt() ->> 'email')
);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'media');

drop policy if exists "media_authenticated_insert" on storage.objects;
create policy "media_authenticated_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');

drop policy if exists "media_authenticated_update" on storage.objects;
create policy "media_authenticated_update"
on storage.objects for update
to authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

drop policy if exists "media_authenticated_delete" on storage.objects;
create policy "media_authenticated_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'media');

-- Novos tabelas para o sistema de pedidos e repertório
create table if not exists public.musicas_repertorio (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid references public.artist_profiles (id) on delete cascade,
  titulo text not null,
  autor text,
  genero text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid references public.artist_profiles (id) on delete cascade,
  cliente_id uuid references public.users (id) on delete set null,
  cliente_nome text,
  session_id text,
  musica text not null,
  mensagem text,
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'recusado', 'concluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.musicas_repertorio enable row level security;
alter table public.pedidos enable row level security;

create policy "musicas_repertorio_public_read"
on public.musicas_repertorio for select
to anon, authenticated
using (true);

create policy "musicas_repertorio_manage_own"
on public.musicas_repertorio for all
to authenticated
using (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
)
with check (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
);

create policy "pedidos_public_insert"
on public.pedidos for insert
to anon, authenticated
with check (true);

create policy "pedidos_read_own"
on public.pedidos for select
to authenticated
using (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
  or cliente_id = (select auth.uid())
);

create policy "pedidos_manage_own"
on public.pedidos for update
to authenticated
using (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
)
with check (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
);

create trigger set_musicas_repertorio_updated_at
before update on public.musicas_repertorio
for each row
execute function public.set_current_timestamp_updated_at();

create trigger set_pedidos_updated_at
before update on public.pedidos
for each row
execute function public.set_current_timestamp_updated_at();

-- Tabela de Setlists
create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid references public.artist_profiles (id) on delete cascade,
  nome text not null,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setlist_musicas (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid references public.setlists (id) on delete cascade,
  musica_id uuid references public.musicas_repertorio (id) on delete cascade,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.setlists enable row level security;
alter table public.setlist_musicas enable row level security;

create policy "setlists_manage_own"
on public.setlists for all
to authenticated
using (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
)
with check (
  artista_id in (
    select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
  )
);

create policy "setlist_musicas_manage_own"
on public.setlist_musicas for all
to authenticated
using (
  setlist_id in (
    select id from public.setlists where artista_id in (
      select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
    )
  )
)
with check (
  setlist_id in (
    select id from public.setlists where artista_id in (
      select id from public.artist_profiles where user_email = (select auth.jwt() ->> 'email')
    )
  )
);

create trigger set_setlists_updated_at
before update on public.setlists
for each row
execute function public.set_current_timestamp_updated_at();
