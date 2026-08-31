-- Menandai menu yang dihapus tanpa menghilangkan data historis pesanan.
alter table public.menus
  add column if not exists deleted_at timestamptz;

-- Mempercepat filter menu aktif pada katalog dan dashboard admin.
create index if not exists menus_deleted_at_idx on public.menus (deleted_at);