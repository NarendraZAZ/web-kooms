create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.support_messages enable row level security;

create policy "Customers can submit support messages"
  on public.support_messages for insert
  to anon, authenticated
  with check (true);

create policy "Admins can view support messages"
  on public.support_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update support messages"
  on public.support_messages for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
