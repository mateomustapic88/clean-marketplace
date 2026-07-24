create or replace function public.accept_offer(target_job_id uuid, target_offer_id uuid)
returns public.offers language plpgsql security definer set search_path = ''
as $$
declare selected_offer public.offers; target_job public.jobs;
begin
  select * into target_job from public.jobs where id = target_job_id for update;
  if target_job.id is null or target_job.owner_id <> auth.uid() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if not public.has_entitlement('owner') then raise exception 'Active owner entitlement required' using errcode = '42501'; end if;
  if target_job.status not in ('published', 'receiving_offers') then raise exception 'Job cannot accept offers in its current state'; end if;
  select * into selected_offer from public.offers where id = target_offer_id and job_id = target_job_id for update;
  if selected_offer.id is null or selected_offer.status <> 'pending' then raise exception 'Offer is not available'; end if;
  update public.offers set status = 'rejected', updated_at = timezone('utc', now())
    where job_id = target_job_id and status = 'pending' and id <> target_offer_id;
  update public.offers set status = 'accepted', updated_at = timezone('utc', now())
    where id = target_offer_id returning * into selected_offer;
  perform set_config('app.trusted_transition', 'on', true);
  update public.jobs set accepted_offer_id = target_offer_id, assigned_cleaner_id = selected_offer.cleaner_id,
    status = 'assigned', updated_at = timezone('utc', now()) where id = target_job_id;
  insert into public.job_activities(job_id, actor_user_id, type, metadata)
    values(target_job_id, auth.uid(), 'offer_accepted', jsonb_build_object('offerId', target_offer_id));
  return selected_offer;
end; $$;

create or replace function public.reject_offer(target_offer_id uuid)
returns public.offers language plpgsql security definer set search_path = ''
as $$
declare selected_offer public.offers;
begin
  select o.* into selected_offer from public.offers o join public.jobs j on j.id = o.job_id
    where o.id = target_offer_id and j.owner_id = auth.uid() for update of o;
  if selected_offer.id is null or selected_offer.status <> 'pending' then raise exception 'Offer is not available' using errcode = '42501'; end if;
  update public.offers set status = 'rejected', updated_at = timezone('utc', now())
    where id = target_offer_id returning * into selected_offer;
  return selected_offer;
end; $$;

create or replace function public.progress_job(target_job_id uuid, target_status public.job_status)
returns public.jobs language plpgsql security definer set search_path = ''
as $$
declare target_job public.jobs; allowed boolean := false;
begin
  select * into target_job from public.jobs where id = target_job_id for update;
  if target_job.id is null or auth.uid() not in (target_job.owner_id, target_job.assigned_cleaner_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  allowed := (target_job.status = 'assigned' and target_status = 'cleaner_confirmed')
    or (target_job.status = 'cleaner_confirmed' and target_status = 'in_progress')
    or (target_job.status = 'in_progress' and target_status = 'completed');
  if not allowed then raise exception 'Invalid job transition'; end if;
  perform set_config('app.trusted_transition', 'on', true);
  update public.jobs set status = target_status, updated_at = timezone('utc', now())
    where id = target_job_id returning * into target_job;
  insert into public.job_activities(job_id, actor_user_id, type)
    values(target_job_id, auth.uid(), case when target_status = 'completed' then 'completed' else target_status::text end);
  return target_job;
end; $$;

create or replace function public.create_review(
  target_job_id uuid, target_reviewee_id uuid, target_score numeric, target_comment text, target_scores jsonb
)
returns public.reviews language plpgsql security definer set search_path = ''
as $$
declare target_job public.jobs; created_review public.reviews; score_item jsonb;
begin
  select * into target_job from public.jobs where id = target_job_id;
  if target_job.status <> 'completed'
    or auth.uid() not in (target_job.owner_id, target_job.assigned_cleaner_id)
    or target_reviewee_id = auth.uid()
    or target_reviewee_id not in (target_job.owner_id, target_job.assigned_cleaner_id) then
    raise exception 'Review is not authorized' using errcode = '42501';
  end if;
  insert into public.reviews(job_id, reviewer_id, reviewee_id, overall_score, comment)
    values(target_job_id, auth.uid(), target_reviewee_id, target_score, target_comment)
    returning * into created_review;
  for score_item in select * from jsonb_array_elements(target_scores) loop
    insert into public.review_category_scores(review_id, category, score)
    values(created_review.id, score_item ->> 'category', (score_item ->> 'score')::smallint);
  end loop;
  return created_review;
end; $$;

revoke all on function public.accept_offer(uuid, uuid) from public;
revoke all on function public.reject_offer(uuid) from public;
revoke all on function public.progress_job(uuid, public.job_status) from public;
revoke all on function public.create_review(uuid, uuid, numeric, text, jsonb) from public;
grant execute on function public.accept_offer(uuid, uuid) to authenticated;
grant execute on function public.reject_offer(uuid) to authenticated;
grant execute on function public.progress_job(uuid, public.job_status) to authenticated;
grant execute on function public.create_review(uuid, uuid, numeric, text, jsonb) to authenticated;
