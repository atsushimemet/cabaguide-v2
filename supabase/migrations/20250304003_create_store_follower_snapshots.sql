set check_function_bodies = off;

create table if not exists public.store_follower_snapshots (
  store_id uuid not null references public.stores (id) on delete cascade,
  followers integer not null default 0,
  captured_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists store_follower_snapshots_store_id_idx
  on public.store_follower_snapshots (store_id);

create index if not exists store_follower_snapshots_captured_at_idx
  on public.store_follower_snapshots (captured_at desc);

drop trigger if exists refresh_store_follower_snapshot on public.cast_follower_snapshots;
drop function if exists public.refresh_store_follower_snapshot();

create or replace function public.refresh_store_follower_snapshot()
returns trigger as $$
declare
  target_store uuid;
  total_followers integer := 0;
begin
  select store_id into target_store from public.casts where id = new.cast_id;

  if target_store is null then
    return new;
  end if;

  with latest_cast_followers as (
    select distinct on (c.id, cfs.platform)
      c.store_id,
      cfs.followers
    from public.casts c
    join public.cast_follower_snapshots cfs on cfs.cast_id = c.id
    where c.store_id = target_store
    order by c.id, cfs.platform, cfs.captured_at desc
  )
  select coalesce(sum(followers), 0) into total_followers
  from latest_cast_followers;

  insert into public.store_follower_snapshots (store_id, followers, captured_at)
  values (target_store, total_followers, timezone('utc'::text, now()));

  return new;
end;
$$ language plpgsql security definer;

create trigger refresh_store_follower_snapshot
after insert or update on public.cast_follower_snapshots
for each row execute function public.refresh_store_follower_snapshot();

do $$
begin
  if not exists (select 1 from public.store_follower_snapshots) then
    with latest_cast_followers as (
      select distinct on (c.id, cfs.platform)
        c.store_id,
        cfs.followers
      from public.casts c
      join public.cast_follower_snapshots cfs on cfs.cast_id = c.id
      order by c.id, cfs.platform, cfs.captured_at desc
    ),
    aggregated as (
      select store_id, sum(followers) as followers
      from latest_cast_followers
      group by store_id
    )
    insert into public.store_follower_snapshots (store_id, followers, captured_at)
    select store_id, followers, timezone('utc'::text, now())
    from aggregated;
  end if;
end;
$$;

drop view if exists public.store_latest_follower_snapshots;

create view public.store_latest_follower_snapshots as
select distinct on (store_id)
  store_id,
  followers,
  captured_at
from public.store_follower_snapshots
order by store_id, captured_at desc;
