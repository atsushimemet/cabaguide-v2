create table if not exists updates (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);
