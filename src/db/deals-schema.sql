-- ============================================================
-- CastZone Specials — fishing & camping deals (>=50% off)
-- Run in: Supabase Dashboard -> SQL Editor -> New Query
-- Idempotent: safe to run more than once.
--
-- The deals BOT (GitHub Action) inserts rows as status='pending'
-- using the service-role key (bypasses RLS).
-- Martin approves/rejects them on /specials/review.
-- Approved deals show publicly on /specials and fire the bell.
-- ============================================================


-- ========================= ADMINS =========================
-- Who is allowed to approve/reject deals. Add yourself ONCE:
--   insert into admins (user_id)
--   select id from auth.users where email = 'YOUR-CASTZONE-LOGIN-EMAIL'
--   on conflict do nothing;

create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Admins can see the admins list; nobody else needs to.
drop policy if exists "admins_select" on admins;
create policy "admins_select"
  on admins for select
  to authenticated
  using (user_id = auth.uid());

-- is_admin(): true when the current logged-in user is in the admins table.
-- SECURITY DEFINER so RLS policies can call it without recursing on admins RLS.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;


-- ========================= DEALS =========================

create table if not exists deals (
  id             uuid          primary key default gen_random_uuid(),
  title          text          not null,
  retailer       text          not null,
  category       text          not null check (category in ('fishing','camping')),
  original_price numeric(10,2),
  sale_price     numeric(10,2),
  discount_pct   int,
  url            text          not null,
  image_url      text,
  source         text,                       -- scraper id, e.g. 'takealot'
  external_id    text unique,                -- dedupe key (retailer + product id/url)
  status         text          not null default 'pending'
                   check (status in ('pending','approved','rejected')),
  found_at       timestamptz   not null default now(),
  approved_at    timestamptz,
  expires_at     timestamptz                 -- optional: auto-hide after this time
);

create index if not exists deals_status_discount_idx on deals (status, discount_pct desc);
create index if not exists deals_status_found_idx     on deals (status, found_at desc);
create index if not exists deals_category_idx         on deals (category);

alter table deals enable row level security;

-- Public sees only approved deals; admins see everything (incl. pending) for review.
drop policy if exists "deals_select" on deals;
create policy "deals_select"
  on deals for select
  using (status = 'approved' or is_admin());

-- Only admins can change a deal's status (approve/reject). The bot uses the
-- service-role key which bypasses RLS, so it needs no insert policy here.
drop policy if exists "deals_update" on deals;
create policy "deals_update"
  on deals for update
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select on deals to anon, authenticated;
grant update on deals to authenticated;


-- ========================= BELL NOTIFICATIONS =========================
-- When a deal flips pending -> approved, notify every real member.
-- Mirrors notify_new_catch() in notifications-schema.sql.

create or replace function notify_new_deal()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
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

drop trigger if exists on_deal_approved on deals;
create trigger on_deal_approved
  after update on deals
  for each row execute function notify_new_deal();
