create table public.jobs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  assigned_cleaner_id uuid references public.profiles(id) on delete set null, accepted_offer_id uuid,
  title text not null check (char_length(title) between 3 and 160), apartment_name text not null check (char_length(apartment_name) <= 160),
  city_code text not null references public.cities(code) on update cascade, approximate_area text not null default '' check (char_length(approximate_area) <= 160),
  hide_exact_address boolean not null default true, size_square_meters integer not null check (size_square_meters > 0),
  bedrooms integer not null default 0 check (bedrooms >= 0), bathrooms integer not null default 0 check (bathrooms >= 0),
  beds integer not null default 0 check (beds >= 0), guest_capacity integer not null default 1 check (guest_capacity > 0),
  estimated_duration_hours numeric(5,2) not null check (estimated_duration_hours > 0), preferred_date date not null,
  preferred_start_time time not null, flexible_time boolean not null default false,
  proposed_budget_cents integer not null check (proposed_budget_cents >= 0), budget_type public.budget_type not null,
  additional_instructions text not null default '' check (char_length(additional_instructions) <= 5000),
  offer_deadline timestamptz not null, status public.job_status not null default 'draft', is_urgent boolean not null default false,
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.job_private_locations (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  exact_address text not null check (char_length(exact_address) between 3 and 300), updated_at timestamptz not null default timezone('utc', now())
);
create table public.job_services (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  cleaning_supplies_provided boolean not null default false, linen_replacement boolean not null default false,
  towel_replacement boolean not null default false, laundry boolean not null default false,
  balcony_cleaning boolean not null default false, fridge_cleaning boolean not null default false,
  oven_cleaning boolean not null default false, kitchen_cleaning boolean not null default false,
  window_cleaning boolean not null default false, same_day_turnover boolean not null default false
);
create table public.job_images (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade, storage_path text not null unique,
  sort_order integer not null default 0 check (sort_order >= 0), is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
create table public.job_activities (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null, type text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_demo boolean not null default false, occurred_at timestamptz not null default timezone('utc', now())
);
create table public.offers (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  proposed_price_cents integer not null check (proposed_price_cents >= 0), price_type public.budget_type not null,
  estimated_duration_hours numeric(5,2) not null check (estimated_duration_hours > 0),
  available_arrival_time timestamptz not null, message text not null default '' check (char_length(message) <= 4000),
  supplies_included boolean not null default false, expires_at timestamptz not null,
  status public.offer_status not null default 'pending', is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  unique (job_id, cleaner_id)
);
alter table public.jobs add constraint jobs_accepted_offer_fk foreign key (accepted_offer_id) references public.offers(id) on delete set null;
create table public.cleaner_favourite_jobs (
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()), primary key (cleaner_id, job_id)
);
