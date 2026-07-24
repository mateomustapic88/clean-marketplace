insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('job-images', 'job-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatar_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatar_safe_read on storage.objects for select
  using (bucket_id = 'avatars' and exists(
    select 1 from public.profiles p where p.avatar_path = name and p.status = 'active'
  ));
create policy avatar_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner_id::text = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatar_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and owner_id::text = auth.uid()::text);
create policy job_image_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'job-images' and (storage.foldername(name))[1] = auth.uid()::text
    and (
      (storage.foldername(name))[2] = 'drafts'
      or exists(select 1 from public.jobs j where j.id::text = (storage.foldername(name))[2] and j.owner_id = auth.uid())
    )
  );
create policy job_image_draft_select on storage.objects for select to authenticated
  using (bucket_id = 'job-images' and (storage.foldername(name))[1] = auth.uid()::text and (storage.foldername(name))[2] = 'drafts');
create policy job_image_safe_select on storage.objects for select
  using (
    bucket_id = 'job-images'
    and exists(select 1 from public.jobs j where j.id::text = (storage.foldername(name))[2]
      and (j.status in ('published', 'receiving_offers') or j.owner_id = auth.uid() or j.assigned_cleaner_id = auth.uid()))
  );
create policy job_image_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'job-images' and owner_id::text = auth.uid()::text)
  with check (bucket_id = 'job-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy job_image_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'job-images' and owner_id::text = auth.uid()::text);
