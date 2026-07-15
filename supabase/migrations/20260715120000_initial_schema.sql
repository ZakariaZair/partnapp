create extension if not exists pgcrypto;

create type project_stage as enum (
  'idea',
  'validation',
  'building',
  'launched'
);

create table public.profiles (
  id uuid primary key,
  display_name text not null,
  headline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partnership_offers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  stage project_stage not null default 'idea',
  skills_needed text[] not null default '{}',
  commitment text,
  location_mode text not null default 'remote',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partnership_interests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.partnership_offers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  created_at timestamptz not null default now(),
  unique (offer_id, profile_id)
);

alter table public.profiles enable row level security;
alter table public.partnership_offers enable row level security;
alter table public.partnership_interests enable row level security;
