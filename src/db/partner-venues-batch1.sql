-- ============================================================
-- CastZone: insert 3 partner venues that confirmed via email
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (ON CONFLICT DO NOTHING).
-- ============================================================

insert into venues (name, slug, province, type, species, lat, lng, permit_required, permit_info, facilities, address, contact_name, contact_phone, contact_email, website)
values

-- 1. Santa Fishing Estate — Dullstroom area, Mpumalanga (confirmed Jun 2026 by Riette)
(
  'Santa Fishing Estate',
  'santa-fishing-estate',
  'Mpumalanga',
  'river',
  ARRAY['Trout'],
  -25.3700, 30.1050,
  true,
  'Private syndicate — day visitor access via Riette. Contact riette@santafishing.co.za for bookings.',
  ARRAY['Accommodation','Day visits'],
  'Steenkampsberg, 12km outside Dullstroom on the Lydenburg road, Mpumalanga',
  'Riette',
  null,
  'riette@santafishing.co.za',
  'https://www.santafishing.co.za'
),

-- 2. Angler & Antelope Guesthouse — Somerset East, Eastern Cape (confirmed Jun 2026 by Annabelle)
(
  'Angler & Antelope Guesthouse',
  'angler-antelope-guesthouse',
  'Eastern Cape',
  'river',
  ARRAY['Trout','Bass'],
  -32.7200, 25.5900,
  false,
  null,
  ARRAY['Accommodation','Day visits'],
  '2 College Road, cnr New Street, Somerset East, Eastern Cape, 5850',
  'Annabelle Hobson',
  '042 243 3440 / 079 488 1361',
  'info@anglerandantelope.co.za',
  'https://www.anglerandantelope.co.za'
),

-- 3. Wild Trout Association — Rhodes / Wartrail / New England, Eastern Cape (confirmed Jun 2026 by Dave Walker)
(
  'Wild Trout Association – Rhodes',
  'wild-trout-rivers-rhodes',
  'Eastern Cape',
  'river',
  ARRAY['Trout','Smallmouth Yellowfish'],
  -30.7900, 27.9900,
  true,
  'Day permits via Rhodes Information Centre: 045 971 9023 / info@rhodesinfo.co.za. No closed season.',
  ARRAY['Day visits'],
  'Wild Trout Association, Rhodes, Eastern Cape, 9787 (Rhodes, Wartrail & New England river district)',
  'Dave Walker',
  null,
  'dave@wildtrout.co.za',
  'https://www.wildtrout.co.za'
)

on conflict (slug) do nothing;
