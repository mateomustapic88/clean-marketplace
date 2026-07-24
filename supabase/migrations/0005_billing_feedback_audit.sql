create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan public.user_role not null check (plan in ('owner', 'cleaner')), status public.subscription_status not null default 'incomplete',
  unit_amount_cents integer not null check (unit_amount_cents >= 0), currency text not null default 'EUR' check (currency = 'EUR'),
  trial_started_at timestamptz, trial_ends_at timestamptz, trial_consumed boolean not null default false,
  current_period_started_at timestamptz, current_period_ends_at timestamptz, cancelled_at timestamptz,
  cancel_at_period_end boolean not null default false, grace_period_ends_at timestamptz,
  stripe_customer_id text unique, stripe_subscription_id text unique, stripe_price_id text,
  last_successful_payment_at timestamptz, last_failed_payment_at timestamptz, stripe_event_created_at timestamptz,
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.billing_invoices (
  id text primary key, user_id uuid not null references public.profiles(id) on delete cascade, number text not null,
  amount_paid_cents integer not null check (amount_paid_cents >= 0), currency text not null default 'EUR' check (currency = 'EUR'),
  status text not null check (status in ('paid', 'open', 'void', 'uncollectible')), issued_at timestamptz not null,
  hosted_invoice_url text, is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.payment_methods (
  id text primary key, user_id uuid not null references public.profiles(id) on delete cascade, brand text not null,
  last4 text not null check (last4 ~ '^[0-9]{4}$'), expiry_month smallint not null check (expiry_month between 1 and 12),
  expiry_year smallint not null check (expiry_year >= 2020), is_default boolean not null default false,
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.stripe_events (
  stripe_event_id text primary key, event_type text not null, event_created_at timestamptz not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  processing_result text, claimed_at timestamptz not null default timezone('utc', now()), processed_at timestamptz
);
create table public.feedback (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null,
  type public.feedback_type not null, email text not null check (char_length(email) between 3 and 320),
  name text not null default '' check (char_length(name) <= 160), subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null, entity_type text not null, entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.request_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, key_hash)
);
