set check_function_bodies = off;

create extension if not exists "pgcrypto";

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  area_id integer not null references public.area (id) on delete restrict,
  name text not null,
  google_map_link text not null,
  phone text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists stores_area_id_idx on public.stores (area_id);

create table if not exists public.store_base_pricings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  nomination_price integer,
  service_fee_rate numeric(4,3),
  tax_rate numeric(4,3),
  extension_price integer,
  light_drink_price integer,
  cheapest_champagne_price integer,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists store_base_pricings_store_id_idx
  on public.store_base_pricings (store_id);

create table if not exists public.store_time_slot_pricings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  time_slot smallint not null check (time_slot between 0 and 24),
  main_price integer not null,
  vip_price integer,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists store_time_slot_unique
  on public.store_time_slot_pricings (store_id, time_slot);

create table if not exists public.casts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  age smallint,
  image_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists casts_store_id_idx on public.casts (store_id);

create table if not exists public.cast_follower_snapshots (
  id uuid primary key default gen_random_uuid(),
  cast_id uuid not null references public.casts (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok')),
  followers integer not null default 0,
  captured_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists cast_follower_snapshots_cast_id_captured_at_idx
  on public.cast_follower_snapshots (cast_id, captured_at desc);

drop view if exists public.areas;

create view public.areas as
select id, todofuken_name, downtown_name from public.area;
