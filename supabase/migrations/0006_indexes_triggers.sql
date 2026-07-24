create index profiles_role_status_idx on public.profiles (role, status);
create index jobs_public_search_idx on public.jobs (status, city_code, preferred_date);
create index jobs_owner_idx on public.jobs (owner_id, created_at desc);
create index jobs_cleaner_idx on public.jobs (assigned_cleaner_id, status);
create index offers_job_status_idx on public.offers (job_id, status, created_at desc);
create index offers_cleaner_idx on public.offers (cleaner_id, status, created_at desc);
create index reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);
create index notifications_user_idx on public.notifications (user_id, archived_at, read_at, created_at desc);
create index subscriptions_status_period_idx on public.subscriptions (status, current_period_ends_at);
create index invoices_user_idx on public.billing_invoices (user_id, issued_at desc);
create index feedback_status_idx on public.feedback (status, created_at desc);
create index activities_job_idx on public.job_activities (job_id, occurred_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'cities', 'profiles', 'profile_private', 'notification_preferences', 'owner_profiles',
    'owner_private_details', 'cleaner_profiles', 'cleaner_private_details', 'jobs',
    'job_private_locations', 'offers', 'reviews', 'notifications', 'subscriptions',
    'billing_invoices', 'payment_methods', 'feedback'
  ] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() = old.id and (
    new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.is_demo is distinct from old.is_demo
  ) then raise exception 'Profile privilege fields are server-managed' using errcode = '42501'; end if;
  return new;
end; $$;
create trigger protect_profile_privileges before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.protect_cleaner_verification()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() = old.user_id and new.verified is distinct from old.verified then
    raise exception 'Verification is server-managed' using errcode = '42501';
  end if;
  return new;
end; $$;
create trigger protect_cleaner_verification before update on public.cleaner_profiles
for each row execute function public.protect_cleaner_verification();

create or replace function public.protect_job_assignment()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() = old.owner_id
    and coalesce(current_setting('app.trusted_transition', true), '') <> 'on'
    and (
      new.accepted_offer_id is distinct from old.accepted_offer_id
      or new.assigned_cleaner_id is distinct from old.assigned_cleaner_id
      or new.status in ('assigned', 'cleaner_confirmed', 'in_progress', 'completed')
    ) then raise exception 'Job assignment and progress require a trusted transition' using errcode = '42501'; end if;
  return new;
end; $$;
create trigger protect_job_assignment before update on public.jobs
for each row execute function public.protect_job_assignment();

create or replace function public.protect_review_identity()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.job_id is distinct from old.job_id
    or new.reviewer_id is distinct from old.reviewer_id
    or new.reviewee_id is distinct from old.reviewee_id
    or new.verified_completed_job is distinct from old.verified_completed_job
    or new.editable_until is distinct from old.editable_until
  then raise exception 'Review identity fields are immutable' using errcode = '42501'; end if;
  return new;
end; $$;
create trigger protect_review_identity before update on public.reviews
for each row execute function public.protect_review_identity();

create or replace function public.protect_notification_content()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() = old.user_id and (
    new.user_id is distinct from old.user_id
    or new.type is distinct from old.type
    or new.title_key is distinct from old.title_key
    or new.message_key is distinct from old.message_key
    or new.resource_id is distinct from old.resource_id
    or new.metadata is distinct from old.metadata
    or new.is_demo is distinct from old.is_demo
  ) then raise exception 'Only notification read/archive state is user-managed' using errcode = '42501'; end if;
  return new;
end; $$;
create trigger protect_notification_content before update on public.notifications
for each row execute function public.protect_notification_content();
