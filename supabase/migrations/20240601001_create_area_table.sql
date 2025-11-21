set check_function_bodies = off;

create schema if not exists public;

create table if not exists public.area (
  id integer primary key,
  todofuken_name text not null,
  downtown_name text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists area_todofuken_downtown_idx
  on public.area (todofuken_name, downtown_name);

create or replace function public.set_current_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger area_set_timestamp
  before update on public.area
  for each row execute procedure public.set_current_timestamp();
