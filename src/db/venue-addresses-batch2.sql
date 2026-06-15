-- ============================================================
-- CastZone: addresses for the remaining private/partner venues
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (idempotent).
-- ============================================================

alter table venues add column if not exists address text;

update venues set address = '2 College Street, Somerset East (KwaNojoli), Eastern Cape, 5850'
 where slug = 'angler-antelope-guesthouse';

update venues set address = '1399 Flamingo Bay, Oranjeville, Free State, 1995'
 where slug = 'flamingo-bay-resort';

update venues set address = 'Wild Trout Association, Rhodes, Eastern Cape, 9787 (Rhodes, Wartrail & New England river district)'
 where slug = 'wild-trout-rivers-rhodes';
