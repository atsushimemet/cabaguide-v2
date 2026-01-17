set check_function_bodies = off;

drop view if exists public.cast_latest_follower_totals;

create view public.cast_latest_follower_totals as
with latest_snapshots as (
  select distinct on (cast_id, platform)
    cast_id,
    platform,
    followers,
    captured_at
  from public.cast_follower_snapshots
  order by cast_id, platform, captured_at desc
)
select
  cast_id,
  sum(followers) as followers,
  max(captured_at) as last_captured_at
from latest_snapshots
group by cast_id;
