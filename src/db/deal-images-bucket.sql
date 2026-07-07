-- Public Storage bucket for re-hosted deal product images.
--
-- Why: /specials was hotlinking product images straight from retailer CDNs
-- (media.takealot.com, Cloudinary). Those CDNs return 503 when the image is
-- requested cross-site from a real browser (anti-hotlink/bot protection) —
-- confirmed broken for every visitor, not just a caching fluke. Fix: the bot
-- downloads each image once at ingest time and re-hosts it here; the site
-- then serves it from our own Supabase Storage instead of the retailer's CDN.
insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do nothing;
