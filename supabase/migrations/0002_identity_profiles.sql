create table public.cities (
  id uuid primary key default gen_random_uuid(), code text not null unique check (char_length(code) between 2 and 20),
  name text not null check (char_length(name) between 1 and 120), county text not null check (char_length(county) between 1 and 120),
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
insert into public.cities (code, name, county) values
  ('zagreb', 'Zagreb', 'Grad Zagreb'),
  ('split', 'Split', 'Splitsko-dalmatinska'),
  ('rijeka', 'Rijeka', 'Primorsko-goranska'),
  ('osijek', 'Osijek', 'Osječko-baranjska'),
  ('zadar', 'Zadar', 'Zadarska'),
  ('dubrovnik', 'Dubrovnik', 'Dubrovačko-neretvanska'),
  ('pula', 'Pula', 'Istarska'),
  ('sibenik', 'Šibenik', 'Šibensko-kninska'),
  ('makarska', 'Makarska', 'Splitsko-dalmatinska'),
  ('varazdin', 'Varaždin', 'Varaždinska'),
  ('karlovac', 'Karlovac', 'Karlovačka')
on conflict (code) do nothing;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, role public.user_role not null,
  status public.user_status not null default 'active', first_name text not null default '' check (char_length(first_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  display_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  avatar_path text, city_code text references public.cities(code) on update cascade,
  bio text not null default '' check (char_length(bio) <= 4000), onboarding_completed boolean not null default false,
  is_demo boolean not null default false, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null default '' check (char_length(phone) <= 40),
  preferred_contact_method text not null default 'email' check (preferred_contact_method in ('email', 'phone', 'sms')),
  preferred_language text not null default 'hr' check (preferred_language in ('hr', 'en')),
  time_zone text not null default 'Europe/Zagreb' check (char_length(time_zone) <= 100),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email boolean not null default true, in_app boolean not null default true, job_updates boolean not null default true,
  offers boolean not null default true, marketing boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.owner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade, company_name text, agency_name text,
  apartment_name text, apartment_city_code text references public.cities(code) on update cascade,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.owner_private_details (
  user_id uuid primary key references public.profiles(id) on delete cascade, apartment_address text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.cleaner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  hourly_rate_cents integer not null default 0 check (hourly_rate_cents >= 0),
  minimum_job_price_cents integer not null default 0 check (minimum_job_price_cents >= 0),
  service_radius_km integer not null default 20 check (service_radius_km between 1 and 500),
  years_of_experience integer not null default 0 check (years_of_experience between 0 and 80),
  biography text not null default '' check (char_length(biography) <= 4000), company_name text, website text,
  own_transportation boolean not null default false, brings_supplies boolean not null default false,
  same_day_available boolean not null default false, weekend_available boolean not null default false,
  vacation_mode boolean not null default false, verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.cleaner_private_details (
  user_id uuid primary key references public.profiles(id) on delete cascade, oib text check (oib is null or oib ~ '^[0-9]{11}$'),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.cleaner_service_areas (
  cleaner_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  city_code text not null references public.cities(code) on update cascade,
  radius_km integer not null check (radius_km between 1 and 500), primary key (cleaner_id, city_code)
);
create table public.cleaner_languages (
  cleaner_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  language_code text not null check (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'), primary key (cleaner_id, language_code)
);
create table public.cleaner_availability (
  id uuid primary key default gen_random_uuid(), cleaner_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), enabled boolean not null default false, unique (cleaner_id, weekday)
);
create table public.cleaner_availability_ranges (
  id uuid primary key default gen_random_uuid(), availability_id uuid not null references public.cleaner_availability(id) on delete cascade,
  start_time time not null, end_time time not null, check (start_time < end_time), unique (availability_id, start_time, end_time)
);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare requested_role text := coalesce(new.raw_user_meta_data ->> 'role', ''); safe_role public.user_role;
begin
  if requested_role not in ('owner', 'cleaner') then raise exception 'Invalid registration role'; end if;
  safe_role := requested_role::public.user_role;
  insert into public.profiles (id, role, first_name, last_name, city_code)
  values (new.id, safe_role, left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 100),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 100),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'city_code', ''), 20), ''));
  insert into public.profile_private (user_id, phone) values (new.id, left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 40));
  insert into public.notification_preferences (user_id) values (new.id);
  if safe_role = 'owner' then
    insert into public.owner_profiles (user_id) values (new.id);
    insert into public.owner_private_details (user_id) values (new.id);
  else
    insert into public.cleaner_profiles (user_id) values (new.id);
    insert into public.cleaner_private_details (user_id) values (new.id);
    insert into public.cleaner_availability (cleaner_id, weekday, enabled) select new.id, day, false from generate_series(0, 6) as day;
  end if;
  return new;
end; $$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();
