-- ============================================================
-- Trophy Room: split "Carp & Freshwater" into Carp / Barbel / Other Freshwater
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run once. New categories: carp, barbel, freshwater, bass, saltwater.
-- ============================================================

-- 1. Widen the category check constraint to allow the new tabs
alter table catches drop constraint if exists catches_category_check;
alter table catches add constraint catches_category_check
  check (category in ('carp', 'barbel', 'freshwater', 'bass', 'saltwater'));

-- 2. Re-sort existing freshwater catches by species
--    (everything currently sits under 'carp'; move barbel + other freshwater out)
update catches set category = 'barbel'
  where category = 'carp' and species ilike '%barbel%';

update catches set category = 'barbel'
  where category = 'carp' and species ilike '%catfish%';

update catches set category = 'freshwater'
  where category = 'carp'
    and ( species ilike '%yellowfish%'
       or species ilike '%mudfish%'
       or species ilike '%tilapia%'
       or species ilike '%kurper%'
       or species ilike '%tiger%'
       or species ilike '%eel%' );

-- Anything left in 'carp' is now actual carp. Bass & saltwater are untouched.
