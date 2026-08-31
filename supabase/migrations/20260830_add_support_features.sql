-- Add is_featured and is_review columns to support_messages for homepage review display
alter table public.support_messages
add column if not exists is_featured boolean default false,
add column if not exists is_review boolean default false;

-- Add index for faster queries
create index if not exists idx_support_messages_is_featured on public.support_messages(is_featured) where is_featured = true;
create index if not exists idx_support_messages_is_review on public.support_messages(is_review) where is_review = true;
