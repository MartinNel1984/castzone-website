-- ============================================================
-- CastZone: add structured contact details to venues
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Add the columns (no-op if they already exist)
alter table venues add column if not exists contact_name  text;
alter table venues add column if not exists contact_phone text;
alter table venues add column if not exists contact_email text;
alter table venues add column if not exists website       text;

-- 2. Populate the private / partner venues that gave us their details
update venues set contact_name='Vivian Harms',    contact_phone='082 748 6448',
  contact_email='hello@twodam.co.za',              website='https://www.twodam.co.za'
  where slug='two-dam-sustainable';

update venues set contact_name='Annabelle Hobson', contact_phone='042 243 3440 / 079 488 1361',
  contact_email='info@anglerandantelope.co.za',    website='https://www.anglerandantelope.co.za'
  where slug='angler-antelope-guesthouse';

update venues set contact_name='Hannes',           contact_phone='056 818 1862',
  contact_email='hannes@dimalachite.co.za',        website='https://www.dimalachite.co.za'
  where slug='dimalachite-river-lodge';

update venues set contact_name='Ilze Zurcher',     contact_phone='064 631 1513',
  contact_email='flamingobay01@gmail.com',         website=null
  where slug='flamingo-bay-resort';

update venues set contact_name='Dave Walker',      contact_phone=null,
  contact_email='dave@wildtrout.co.za',            website='https://www.wildtrout.co.za'
  where slug='wild-trout-rivers-rhodes';
