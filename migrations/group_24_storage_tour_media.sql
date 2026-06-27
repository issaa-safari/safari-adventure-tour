-- Group 24: Public storage bucket for tour media (hero, gallery, per-day photos).
-- Uploads are performed server-side with the service-role key (bypasses RLS),
-- so only the public-read bucket itself is required here. Idempotent.

insert into storage.buckets (id, name, public)
values ('tour-media', 'tour-media', true)
on conflict (id) do update set public = true;
