alter table if exists public.store_time_slot_pricings
  add column if not exists time_slot_hour smallint,
  add column if not exists time_slot_minute smallint;

update public.store_time_slot_pricings
set
  time_slot_hour = coalesce(time_slot_hour, time_slot),
  time_slot_minute = coalesce(time_slot_minute, 0)
where time_slot is not null;

alter table if exists public.store_time_slot_pricings
  alter column time_slot_hour set not null,
  alter column time_slot_minute set not null;

alter table if exists public.store_time_slot_pricings
  drop constraint if exists store_time_slot_pricings_time_slot_check;

drop index if exists store_time_slot_unique;

alter table if exists public.store_time_slot_pricings
  drop column if exists time_slot;

alter table if exists public.store_time_slot_pricings
  add constraint store_time_slot_pricings_time_slot_range_check
    check (
      time_slot_hour between 0 and 24
      and time_slot_minute between 0 and 59
      and (time_slot_hour < 24 or time_slot_minute = 0)
    );

create unique index if not exists store_time_slot_unique
  on public.store_time_slot_pricings (store_id, time_slot_hour, time_slot_minute);
