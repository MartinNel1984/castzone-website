-- ============================================================
-- CastZone: add human-readable address + fix a venue pin
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Add the address column (no-op if it already exists)
alter table venues add column if not exists address text;

-- 2. Dimalachite — correct the pin and add a real location
update venues
   set lat = -26.904018,
       lng = 27.369109,
       address = 'Off the R59 (Parys–Vredefort road), Vaal River, Vredefort Dome, Parys, Free State, 9595'
 where slug = 'dimalachite-river-lodge';

-- 3. Two Dam — add its farm address
update venues
   set address = 'Langhoogte Farm, Keisie Valley, Montagu, 6720, Western Cape'
 where slug = 'two-dam-sustainable';
