-- ============================================================
-- CastZone Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
-- One profile per registered user. Extends Supabase auth.users.

create table if not exists profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  avatar_url    text,
  member_level  text not null default 'First Cast',
  post_count    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── Categories ───────────────────────────────────────────────

create table if not exists categories (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  description text not null,
  colour      text not null default '#2a6e6e',
  icon        text not null default '🎣',
  sort_order  integer not null default 0,
  thread_count integer not null default 0,
  post_count   integer not null default 0
);

-- Seed the 4 forum categories
insert into categories (slug, name, description, colour, icon, sort_order) values
  ('bass',      'Bass Fishing',    'Tackle, techniques, dams, tournaments and reports for SA bass anglers.',               '#2d6a4f', '🎣', 1),
  ('saltwater', 'Saltwater',       'Shore, offshore, lure, kayak and ski-boat angling along the SA coast.',                '#1d3557', '🌊', 2),
  ('specimen',  'Specimen & Carp', 'European-style specimen carp fishing, rigs, bait and big fish stories.',               '#6b4226', '🐟', 3),
  ('general',   'General Angling', 'Everything else — freshwater, fly fishing, beginner questions and more.',              '#2a6e6e', '🏞️', 4)
on conflict (slug) do nothing;


-- ── Threads ──────────────────────────────────────────────────

create table if not exists threads (
  id           uuid not null default gen_random_uuid() primary key,
  category_id  integer not null references categories(id),
  author_id    uuid not null references profiles(id),
  title        text not null,
  is_pinned    boolean not null default false,
  is_locked    boolean not null default false,
  view_count   integer not null default 0,
  reply_count  integer not null default 0,
  last_post_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);


-- ── Posts ────────────────────────────────────────────────────

create table if not exists posts (
  id             uuid not null default gen_random_uuid() primary key,
  thread_id      uuid not null references threads(id) on delete cascade,
  author_id      uuid not null references profiles(id),
  content        text not null,
  is_first_post  boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ── Auto-update counters ──────────────────────────────────────

-- Update thread reply_count and last_post_at when a post is added
create or replace function handle_new_post()
returns trigger language plpgsql security definer as $$
begin
  -- Update thread counters
  update threads
  set reply_count  = reply_count + 1,
      last_post_at = now()
  where id = new.thread_id and new.is_first_post = false;

  -- Update category post count
  update categories
  set post_count = post_count + 1
  where id = (select category_id from threads where id = new.thread_id);

  -- Update author post count
  update profiles
  set post_count = post_count + 1
  where id = new.author_id;

  -- Update member level based on post count
  update profiles set member_level = case
    when post_count >= 500 then 'Licenced'
    when post_count >= 100 then 'Regular'
    else 'First Cast'
  end
  where id = new.author_id;

  return new;
end;
$$;

drop trigger if exists on_post_created on posts;
create trigger on_post_created
  after insert on posts
  for each row execute procedure handle_new_post();

-- Update category thread count when a thread is created
create or replace function handle_new_thread()
returns trigger language plpgsql security definer as $$
begin
  update categories
  set thread_count = thread_count + 1
  where id = new.category_id;
  return new;
end;
$$;

drop trigger if exists on_thread_created on threads;
create trigger on_thread_created
  after insert on threads
  for each row execute procedure handle_new_thread();


-- ── Row Level Security ────────────────────────────────────────

alter table profiles  enable row level security;
alter table categories enable row level security;
alter table threads    enable row level security;
alter table posts      enable row level security;

-- Profiles: anyone can read, only the owner can update their own
create policy "profiles_read"   on profiles  for select using (true);
create policy "profiles_update" on profiles  for update using (auth.uid() = id);

-- Categories: anyone can read
create policy "categories_read" on categories for select using (true);

-- Threads: anyone can read, authenticated users can create
create policy "threads_read"   on threads for select using (true);
create policy "threads_insert" on threads for insert with check (auth.uid() = author_id);
create policy "threads_update" on threads for update using (auth.uid() = author_id);

-- Posts: anyone can read, authenticated users can create, authors can edit
create policy "posts_read"   on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = author_id);
create policy "posts_update" on posts for update using (auth.uid() = author_id);
