-- Notifications table + trigger for new trophy catches.
-- Run once in the Supabase SQL editor.

-- 1. Table
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null default 'new_catch',
  title      text not null,
  body       text,
  url        text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "own select" on notifications for select using (auth.uid() = user_id);
create policy "own update" on notifications for update using (auth.uid() = user_id);

-- 2. Enable Realtime so the bell updates live without page refresh
alter publication supabase_realtime add table notifications;

-- 3. Trigger: when Martin approves a catch, notify all real members except the submitter
create or replace function notify_new_catch()
returns trigger language plpgsql security definer as $$
declare
  catcher_username text;
begin
  if new.approved = true and (old.approved = false or old.approved is null) then
    select username into catcher_username from public.profiles where id = new.user_id;

    insert into notifications (user_id, type, title, body, url)
    select
      p.id,
      'new_catch',
      'New trophy catch! 🏆',
      coalesce(catcher_username, 'An angler') || ' just posted a ' ||
        round(new.weight_kg::numeric, 2) || ' kg ' || new.species,
      '/catches'
    from public.profiles p
    where p.id != new.user_id
      and p.is_seed = false;
  end if;
  return new;
end;
$$;

drop trigger if exists on_catch_approved on catches;
create trigger on_catch_approved
  after update on catches
  for each row execute function notify_new_catch();
