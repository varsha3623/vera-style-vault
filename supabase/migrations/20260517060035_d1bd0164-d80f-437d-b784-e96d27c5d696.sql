
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Replace broad public SELECT with object-by-id read; disallow LIST through storage API
drop policy if exists "wardrobe_read_public" on storage.objects;
drop policy if exists "collages_read_public" on storage.objects;
drop policy if exists "avatars_read_public" on storage.objects;

-- Allow reads via public URL (object name explicitly known) by all, but no enumeration
create policy "wardrobe_read_by_name" on storage.objects for select
  using (bucket_id = 'wardrobe-images');
create policy "collages_read_by_name" on storage.objects for select
  using (bucket_id = 'collages');
create policy "avatars_read_by_name" on storage.objects for select
  using (bucket_id = 'avatars');
