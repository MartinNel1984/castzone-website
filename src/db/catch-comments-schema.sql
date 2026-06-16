-- Trophy Room comments: anglers leave feedback on each other's catch photos.
-- Run once in the Supabase SQL editor.
--
-- user_id references profiles(id) (NOT auth.users) so PostgREST can embed
-- profiles(username, avatar_url) on a comment — same as the catches table.
-- profiles.id == auth.users.id, so auth.uid() = user_id still works for RLS.

create table if not exists catch_comments (
  id          uuid primary key default gen_random_uuid(),
  catch_id    uuid not null references catches(id)   on delete cascade,
  user_id     uuid not null references profiles(id)  on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index if not exists catch_comments_catch_idx on catch_comments (catch_id, created_at);

alter table catch_comments enable row level security;

drop policy if exists "catch_comments read"       on catch_comments;
drop policy if exists "catch_comments insert own" on catch_comments;
drop policy if exists "catch_comments delete own" on catch_comments;

create policy "catch_comments read"       on catch_comments for select using (true);
create policy "catch_comments insert own" on catch_comments for insert with check (auth.uid() = user_id);
create policy "catch_comments delete own" on catch_comments for delete using (auth.uid() = user_id);
