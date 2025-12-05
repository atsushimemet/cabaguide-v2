alter table store_base_pricings
  drop column if exists light_drink_price,
  drop column if exists cheapest_champagne_price;
