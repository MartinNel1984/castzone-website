-- Bookmarks: members save threads to read later.
-- Run once in the Supabase SQL editor.

create table if not exists bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  thread_id   uuid not null references threads(id)    on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, thread_id)
);

alter table bookmarks enable row level security;

create policy "own select" on bookmarks for select using (auth.uid() = user_id);
create policy "own insert" on bookmarks for insert with check (auth.uid() = user_id);
create policy "own delete" on bookmarks for delete using (auth.uid() = user_id);
