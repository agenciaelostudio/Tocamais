-- Migration: Add setlists tables
-- Run this to add setlist functionality

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