alter table public.jobs enable row level security;
alter table public.job_private_locations enable row level security;
alter table public.job_services enable row level security;
alter table public.job_images enable row level security;
alter table public.job_activities enable row level security;
alter table public.offers enable row level security;
alter table public.cleaner_favourite_jobs enable row level security;
alter table public.reviews enable row level security;
alter table public.review_category_scores enable row level security;
alter table public.notifications enable row level security;

create policy jobs_public_read on public.jobs for select using (
  status in ('published', 'receiving_offers') or owner_id = auth.uid() or assigned_cleaner_id = auth.uid() or public.is_admin()
);
create policy jobs_owner_insert on public.jobs for insert to authenticated
  with check (
    owner_id = auth.uid() and public.current_user_role() = 'owner'
    and (status = 'draft' or public.has_entitlement('owner'))
  );
create policy jobs_owner_update on public.jobs for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.current_user_role() = 'owner'
    and (status = 'draft' or public.has_entitlement('owner')));
create policy jobs_owner_delete on public.jobs for delete to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy locations_participant_read on public.job_private_locations for select to authenticated
  using (public.owns_job(job_id) or exists(select 1 from public.jobs j where j.id = job_id and j.assigned_cleaner_id = auth.uid()) or public.is_admin());
create policy locations_owner_write on public.job_private_locations for all to authenticated using (public.owns_job(job_id)) with check (public.owns_job(job_id));
create policy services_read on public.job_services for select using (
  exists(select 1 from public.jobs j where j.id = job_id and
    (j.status in ('published', 'receiving_offers') or j.owner_id = auth.uid() or j.assigned_cleaner_id = auth.uid() or public.is_admin()))
);
create policy services_owner_write on public.job_services for all to authenticated using (public.owns_job(job_id)) with check (public.owns_job(job_id));
create policy images_read on public.job_images for select using (
  exists(select 1 from public.jobs j where j.id = job_id and
    (j.status in ('published', 'receiving_offers') or j.owner_id = auth.uid() or j.assigned_cleaner_id = auth.uid() or public.is_admin()))
);
create policy images_owner_write on public.job_images for all to authenticated
  using (owner_id = auth.uid() and public.owns_job(job_id)) with check (owner_id = auth.uid() and public.owns_job(job_id));
create policy activities_participant_read on public.job_activities for select to authenticated using (public.participates_in_job(job_id) or public.is_admin());
create policy offers_participant_read on public.offers for select to authenticated
  using (cleaner_id = auth.uid() or public.owns_job(job_id) or public.is_admin());
create policy offers_cleaner_insert on public.offers for insert to authenticated with check (
  cleaner_id = auth.uid() and public.current_user_role() = 'cleaner' and public.has_entitlement('cleaner')
  and exists(select 1 from public.jobs j where j.id = job_id and j.status in ('published', 'receiving_offers'))
);
create policy offers_cleaner_update on public.offers for update to authenticated
  using (cleaner_id = auth.uid() and status = 'pending') with check (cleaner_id = auth.uid() and status in ('pending', 'withdrawn'));
create policy favourites_self on public.cleaner_favourite_jobs for all to authenticated
  using (cleaner_id = auth.uid()) with check (cleaner_id = auth.uid() and public.current_user_role() = 'cleaner');
create policy reviews_public_read on public.reviews for select using (verified_completed_job);
create policy reviews_author_update on public.reviews for update to authenticated
  using (reviewer_id = auth.uid() and editable_until > timezone('utc', now()))
  with check (reviewer_id = auth.uid() and reviewee_id <> auth.uid());
create policy scores_public_read on public.review_category_scores for select using (
  exists(select 1 from public.reviews r where r.id = review_id and r.verified_completed_job)
);
create policy scores_author_update on public.review_category_scores for all to authenticated
  using (exists(select 1 from public.reviews r where r.id = review_id and r.reviewer_id = auth.uid() and r.editable_until > timezone('utc', now())))
  with check (exists(select 1 from public.reviews r where r.id = review_id and r.reviewer_id = auth.uid() and r.editable_until > timezone('utc', now())));
create policy notifications_self_read on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy notifications_self_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
