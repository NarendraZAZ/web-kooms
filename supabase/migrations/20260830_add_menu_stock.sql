-- Add stock column to menus table for inventory management
alter table public.menus
add column if not exists stock integer default null;

-- Add index for stock filtering
create index if not exists idx_menus_stock on public.menus(stock);
