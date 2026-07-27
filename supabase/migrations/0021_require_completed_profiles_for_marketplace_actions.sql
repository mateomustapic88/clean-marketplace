create or replace function public.has_completed_profile(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role = required_role
      and profile.status = 'active'
      and profile.onboarding_completed
  );
$$;

revoke all on function public.has_completed_profile(public.user_role) from public;
grant execute on function public.has_completed_profile(public.user_role) to authenticated;

comment on function public.has_completed_profile(public.user_role) is
  'Confirms that the authenticated user has completed onboarding for the required marketplace role.';

drop policy if exists jobs_owner_insert on public.jobs;
create policy jobs_owner_insert on public.jobs for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.current_user_role() = 'owner'
    and (
      status = 'draft'
      or (
        public.has_completed_profile('owner')
        and public.has_entitlement('owner')
      )
    )
  );

drop policy if exists jobs_owner_update on public.jobs;
create policy jobs_owner_update on public.jobs for update to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and public.current_user_role() = 'owner'
    and (
      status = 'draft'
      or (
        public.has_completed_profile('owner')
        and public.has_entitlement('owner')
      )
    )
  );

drop policy if exists offers_cleaner_insert on public.offers;
create policy offers_cleaner_insert on public.offers for insert to authenticated
  with check (
    cleaner_id = auth.uid()
    and public.current_user_role() = 'cleaner'
    and public.has_completed_profile('cleaner')
    and public.has_entitlement('cleaner')
    and exists(
      select 1
      from public.jobs as job
      where job.id = job_id
        and job.status in ('published', 'receiving_offers')
    )
  );

drop policy if exists offers_cleaner_update on public.offers;
create policy offers_cleaner_update on public.offers for update to authenticated
  using (
    cleaner_id = auth.uid()
    and status = 'pending'
  )
  with check (
    cleaner_id = auth.uid()
    and (
      status = 'withdrawn'
      or (
        status = 'pending'
        and public.has_completed_profile('cleaner')
        and public.has_entitlement('cleaner')
      )
    )
  );
