-- Deal-email opt-out flag for members (POPIA unsubscribe).
-- Run once in Supabase SQL Editor (part of Phase C / Resend setup).
-- When someone emails unsubscribe@castzone.co.za, set this true for their row:
--   update profiles set email_opt_out = true where username = 'thatuser';

alter table profiles add column if not exists email_opt_out boolean not null default false;
