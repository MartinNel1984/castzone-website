-- Notify a catch owner when someone comments on their Trophy Room photo.
-- Run once in the Supabase SQL editor (after catch-comments-schema.sql).
-- Reuses the existing notifications table + NotificationBell (no app changes).

create or replace function notify_catch_comment()
returns trigger language plpgsql security definer as $$
declare
  owner_id           uuid;
  catch_species      text;
  commenter_username text;
begin
  select user_id, species into owner_id, catch_species
  from public.catches where id = new.catch_id;

  -- Skip if the commenter is the catch owner (don't notify yourself).
  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;

  select username into commenter_username
  from public.profiles where id = new.user_id;

  insert into notifications (user_id, type, title, body, url)
  values (
    owner_id,
    'comment',
    'New comment on your catch 💬',
    coalesce(commenter_username, 'An angler') || ' commented on your '
      || coalesce(catch_species, 'catch') || ': "'
      || left(new.body, 80) || case when length(new.body) > 80 then '…' else '' end || '"',
    '/catches'
  );
  return new;
end;
$$;

drop trigger if exists on_catch_comment on catch_comments;
create trigger on_catch_comment
  after insert on catch_comments
  for each row execute function notify_catch_comment();
