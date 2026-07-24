do $$ begin
  create type public.billing_period as enum ('monthly', 'annual');
exception
  when duplicate_object then null;
end $$;

alter table public.subscriptions
  add column if not exists billing_period public.billing_period not null default 'monthly',
  add column if not exists stripe_interval text;

alter table public.subscriptions
  drop constraint if exists subscriptions_stripe_interval_check;

alter table public.subscriptions
  add constraint subscriptions_stripe_interval_check
  check (stripe_interval is null or stripe_interval in ('month', 'year'));

comment on column public.subscriptions.billing_period is
  'Application billing cadence selected for this subscription.';

comment on column public.subscriptions.stripe_interval is
  'Stripe recurring price interval projected from webhook data.';
