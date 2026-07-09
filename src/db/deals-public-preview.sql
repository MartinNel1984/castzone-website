-- Public preview of Specials for the homepage teaser.
-- deals-require-auth.sql intentionally blocks anon from reading the `deals`
-- table directly (to stop scraping of affiliate URLs). But we still want
-- logged-out visitors to see a taste of what's live, as a signup driver.
--
-- These SECURITY DEFINER functions expose only a safe subset of columns
-- (no `url`) to anon, plus a count, without loosening the underlying RLS.
-- Run in: Supabase Dashboard -> SQL Editor -> New Query. Idempotent.

create or replace function get_deals_public_count()
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(*)
  from deals
  where status = 'approved'
    and (expires_at is null or expires_at > now());
$$;

create or replace function get_deals_public_preview(limit_count int default 4)
returns table (
  id uuid,
  title text,
  retailer text,
  category text,
  original_price numeric,
  sale_price numeric,
  discount_pct int,
  image_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select d.id, d.title, d.retailer, d.category, d.original_price, d.sale_price, d.discount_pct, d.image_url
  from deals d
  where d.status = 'approved'
    and (d.expires_at is null or d.expires_at > now())
  order by d.discount_pct desc nulls last, d.found_at desc
  limit limit_count;
$$;

grant execute on function get_deals_public_count() to anon, authenticated;
grant execute on function get_deals_public_preview(int) to anon, authenticated;
