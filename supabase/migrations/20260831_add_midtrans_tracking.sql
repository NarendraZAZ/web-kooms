-- Add midtrans_transaction_id to orders table for better payment tracking and idempotency
alter table public.orders
add column if not exists midtrans_transaction_id text unique;

-- Create index for faster lookup by transaction ID
create index if not exists idx_orders_midtrans_transaction_id 
on public.orders(midtrans_transaction_id) 
where midtrans_transaction_id is not null;

-- Ensure payment_status values are consistent
comment on column public.orders.payment_status is 'Values: pending, paid, challenge, failed, expired';
comment on column public.orders.order_status is 'Values: waiting_payment, processing (sedang dimasak), ready_pickup, completed, cancelled';
