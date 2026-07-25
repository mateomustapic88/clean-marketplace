create or replace function public.has_entitlement(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.profiles p
    join public.subscriptions s on s.user_id = p.id
    where p.id = auth.uid()
      and p.role = required_role
      and p.status = 'active'
      and s.plan = required_role
      and nullif(btrim(s.stripe_subscription_id), '') is not null
      and (
        (s.status = 'trial' and s.trial_ends_at > timezone('utc', now()))
        or (
          s.status = 'active'
          and s.current_period_ends_at > timezone('utc', now())
        )
        or (
          s.status = 'past_due'
          and s.grace_period_ends_at > timezone('utc', now())
        )
        or (
          s.status = 'cancelled'
          and s.current_period_ends_at > timezone('utc', now())
        )
      )
  );
$$;

revoke all on function public.has_entitlement(public.user_role) from public;
grant execute on function public.has_entitlement(public.user_role) to authenticated;

comment on function public.has_entitlement(public.user_role) is
  'Grants marketplace Premium capabilities only for provider-backed Stripe subscriptions.';
