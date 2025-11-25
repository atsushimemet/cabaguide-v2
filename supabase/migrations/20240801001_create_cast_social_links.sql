create table if not exists public.cast_social_links (
  id uuid primary key default gen_random_uuid(),
  cast_id uuid not null references public.casts (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'twitter', 'youtube', 'line', 'website', 'other')),
  url text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists cast_social_links_cast_platform_idx
  on public.cast_social_links (cast_id, platform);

create trigger cast_social_links_set_timestamp
  before update on public.cast_social_links
  for each row execute procedure public.set_current_timestamp();
