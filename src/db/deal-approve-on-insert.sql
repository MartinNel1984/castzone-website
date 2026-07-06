-- Fire the 🔔 bell when a deal is INSERTED already-approved (auto-approve).
-- The existing on_deal_approved trigger only fires on UPDATE (manual approval),
-- so auto-approved deals inserted by the bot need this INSERT trigger too.
-- Run once in Supabase SQL Editor.

create or replace function notify_deal_inserted()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.status = 'approved' then
    insert into notifications (user_id, type, title, body, url)
    select
      p.id,
      'new_deal',
      'New special! ' || coalesce(new.discount_pct::text || '% off', 'Deal') || ' 🔥',
      coalesce(new.retailer || ': ', '') || new.title,
      '/specials'
    from public.profiles p
    where p.is_seed = false;
  end if;
  return new;
end;
$$;

drop trigger if exists on_deal_inserted on deals;
create trigger on_deal_inserted
  after insert on deals
  for each row execute function notify_deal_inserted();
