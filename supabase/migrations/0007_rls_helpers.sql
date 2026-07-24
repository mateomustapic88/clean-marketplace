create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() and status = 'active'; $$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_user_role() = 'admin', false); $$;
create or replace function public.owns_job(target_job_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.jobs where id = target_job_id and owner_id = auth.uid()); $$;
create or replace function public.participates_in_job(target_job_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.jobs where id = target_job_id and (owner_id = auth.uid() or assigned_cleaner_id = auth.uid())); $$;
create or replace function public.has_entitlement(required_role public.user_role)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.profiles p join public.subscriptions s on s.user_id = p.id
    where p.id = auth.uid() and p.role = required_role and p.status = 'active' and s.plan = required_role
      and ((s.status = 'trial' and s.trial_ends_at > timezone('utc', now()))
        or (s.status = 'active' and (s.current_period_ends_at is null or s.current_period_ends_at > timezone('utc', now())))
        or (s.status = 'cancelled' and s.current_period_ends_at > timezone('utc', now())))
  );
$$;
revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.owns_job(uuid) from public;
revoke all on function public.participates_in_job(uuid) from public;
revoke all on function public.has_entitlement(public.user_role) from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_job(uuid) to authenticated;
grant execute on function public.participates_in_job(uuid) to authenticated;
grant execute on function public.has_entitlement(public.user_role) to authenticated;
