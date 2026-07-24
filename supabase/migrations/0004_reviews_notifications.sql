create table public.reviews (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  overall_score numeric(2,1) not null check (overall_score between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 4000),
  verified_completed_job boolean not null default true check (verified_completed_job),
  editable_until timestamptz not null default (timezone('utc', now()) + interval '14 days'),
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()), check (reviewer_id <> reviewee_id), unique (job_id, reviewer_id)
);
create table public.review_category_scores (
  review_id uuid not null references public.reviews(id) on delete cascade,
  category text not null check (category in ('cleaning_quality', 'reliability', 'communication', 'punctuality', 'accuracy', 'fairness', 'payment_experience')),
  score smallint not null check (score between 1 and 5), primary key (review_id, category)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, title_key text not null, message_key text not null, resource_id uuid,
  read_at timestamptz, archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
