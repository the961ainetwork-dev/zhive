-- zhive.xyz — Supabase schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- Profiles (one row per registered user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

-- Orders (prototype checkout — no payment processing)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  items jsonb not null,
  total integer not null,
  created_at timestamptz not null default now()
);

-- Purchases (which agents a user has access to)
create table if not exists public.purchases (
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, agent_id)
);

-- Row-level security: users can only touch their own rows.
-- The admin dashboard bypasses RLS server-side via the service-role key (api/admin.js).
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.purchases enable row level security;

create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own orders read"  on public.orders for select using (auth.uid() = user_id);
create policy "own orders write" on public.orders for insert with check (auth.uid() = user_id);

create policy "own purchases read"  on public.purchases for select using (auth.uid() = user_id);
create policy "own purchases write" on public.purchases for insert with check (auth.uid() = user_id);

-- Business profile: one intake shared by every agent (added for the methodology upgrade)
alter table public.profiles add column if not exists business jsonb;

-- Events: lightweight product metrics (activation, runs, demo→paid)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  type text not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "events insert" on public.events for insert
  with check (user_id is null or auth.uid() = user_id);
-- No client select policy: only the admin API (service role) reads events.

-- Saved pipelines: reusable agent chains (Phase 1 of Loop Engineering)
create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  agent_ids jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.pipelines enable row level security;
drop policy if exists "own pipelines read"   on public.pipelines;
drop policy if exists "own pipelines write"  on public.pipelines;
drop policy if exists "own pipelines delete" on public.pipelines;
create policy "own pipelines read"   on public.pipelines for select using (auth.uid() = user_id);
create policy "own pipelines write"  on public.pipelines for insert with check (auth.uid() = user_id);
create policy "own pipelines delete" on public.pipelines for delete using (auth.uid() = user_id);
