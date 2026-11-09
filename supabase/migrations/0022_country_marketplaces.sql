alter table public.cities
  add column country_code text not null default 'HR'
    check (country_code in ('HR', 'US')),
  add column region_code text not null default '',
  add column region_name text not null default '',
  add column time_zone text not null default 'Europe/Zagreb';

update public.cities
set region_name = county
where country_code = 'HR' and region_name = '';

create unique index cities_country_code_code_idx
  on public.cities (country_code, code);

alter table public.profiles
  add column country_code text not null default 'HR'
    check (country_code in ('HR', 'US')),
  add column currency_code text not null default 'EUR'
    check (currency_code in ('EUR', 'USD')),
  add constraint profiles_country_city_fk
    foreign key (country_code, city_code)
    references public.cities(country_code, code)
    on update cascade;

alter table public.jobs
  add column country_code text not null default 'HR'
    check (country_code in ('HR', 'US')),
  add column currency_code text not null default 'EUR'
    check (currency_code in ('EUR', 'USD')),
  add constraint jobs_country_city_fk
    foreign key (country_code, city_code)
    references public.cities(country_code, code)
    on update cascade;

create index profiles_country_created_idx
  on public.profiles (country_code, created_at desc);
create index jobs_country_status_created_idx
  on public.jobs (country_code, status, created_at desc);

insert into public.cities (
  code, name, county, country_code, region_code, region_name, time_zone
) values
  ('us-ny-new-york', 'New York', 'New York', 'US', 'NY', 'New York', 'America/New_York'),
  ('us-fl-miami', 'Miami', 'Florida', 'US', 'FL', 'Florida', 'America/New_York'),
  ('us-fl-orlando', 'Orlando', 'Florida', 'US', 'FL', 'Florida', 'America/New_York'),
  ('us-fl-tampa', 'Tampa', 'Florida', 'US', 'FL', 'Florida', 'America/New_York'),
  ('us-ca-los-angeles', 'Los Angeles', 'California', 'US', 'CA', 'California', 'America/Los_Angeles'),
  ('us-ca-san-diego', 'San Diego', 'California', 'US', 'CA', 'California', 'America/Los_Angeles'),
  ('us-ca-san-francisco', 'San Francisco', 'California', 'US', 'CA', 'California', 'America/Los_Angeles'),
  ('us-tx-austin', 'Austin', 'Texas', 'US', 'TX', 'Texas', 'America/Chicago'),
  ('us-tx-dallas', 'Dallas', 'Texas', 'US', 'TX', 'Texas', 'America/Chicago'),
  ('us-tx-houston', 'Houston', 'Texas', 'US', 'TX', 'Texas', 'America/Chicago'),
  ('us-il-chicago', 'Chicago', 'Illinois', 'US', 'IL', 'Illinois', 'America/Chicago'),
  ('us-az-phoenix', 'Phoenix', 'Arizona', 'US', 'AZ', 'Arizona', 'America/Phoenix'),
  ('us-nv-las-vegas', 'Las Vegas', 'Nevada', 'US', 'NV', 'Nevada', 'America/Los_Angeles'),
  ('us-wa-seattle', 'Seattle', 'Washington', 'US', 'WA', 'Washington', 'America/Los_Angeles'),
  ('us-ma-boston', 'Boston', 'Massachusetts', 'US', 'MA', 'Massachusetts', 'America/New_York'),
  ('us-co-denver', 'Denver', 'Colorado', 'US', 'CO', 'Colorado', 'America/Denver'),
  ('us-tn-nashville', 'Nashville', 'Tennessee', 'US', 'TN', 'Tennessee', 'America/Chicago'),
  ('us-la-new-orleans', 'New Orleans', 'Louisiana', 'US', 'LA', 'Louisiana', 'America/Chicago'),
  ('us-hi-honolulu', 'Honolulu', 'Hawaii', 'US', 'HI', 'Hawaii', 'Pacific/Honolulu'),
  ('us-ga-atlanta', 'Atlanta', 'Georgia', 'US', 'GA', 'Georgia', 'America/New_York')
on conflict (code) do update set
  name = excluded.name,
  county = excluded.county,
  country_code = excluded.country_code,
  region_code = excluded.region_code,
  region_name = excluded.region_name,
  time_zone = excluded.time_zone;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', '');
  requested_country text := coalesce(new.raw_user_meta_data ->> 'country_code', 'HR');
  requested_city text := nullif(left(coalesce(new.raw_user_meta_data ->> 'city_code', ''), 20), '');
  safe_role public.user_role;
begin
  if requested_role not in ('owner', 'cleaner') then raise exception 'Invalid registration role'; end if;
  if requested_country not in ('HR', 'US') then raise exception 'Invalid marketplace country'; end if;
  if requested_city is not null and not exists (
    select 1 from public.cities
    where code = requested_city and country_code = requested_country
  ) then
    raise exception 'City does not belong to the selected country';
  end if;

  safe_role := requested_role::public.user_role;
  insert into public.profiles (
    id, role, first_name, last_name, city_code, country_code, currency_code
  ) values (
    new.id,
    safe_role,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 100),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 100),
    requested_city,
    requested_country,
    case when requested_country = 'US' then 'USD' else 'EUR' end
  );
  insert into public.profile_private (user_id, phone)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 40));
  insert into public.notification_preferences (user_id) values (new.id);
  if safe_role = 'owner' then
    insert into public.owner_profiles (user_id) values (new.id);
    insert into public.owner_private_details (user_id) values (new.id);
  else
    insert into public.cleaner_profiles (user_id) values (new.id);
    insert into public.cleaner_private_details (user_id) values (new.id);
    insert into public.cleaner_availability (cleaner_id, weekday, enabled)
    select new.id, day, false from generate_series(0, 6) as day;
  end if;
  return new;
end; $$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create or replace function public.enforce_job_market()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_country text;
  owner_currency text;
begin
  select country_code, currency_code
  into owner_country, owner_currency
  from public.profiles
  where id = new.owner_id and role = 'owner';

  if owner_country is null then raise exception 'Invalid job owner'; end if;
  new.country_code := owner_country;
  new.currency_code := owner_currency;
  return new;
end; $$;

revoke all on function public.enforce_job_market() from public, anon, authenticated;
drop trigger if exists enforce_job_market on public.jobs;
create trigger enforce_job_market
before insert or update of owner_id, city_code, country_code, currency_code
on public.jobs for each row execute function public.enforce_job_market();

create or replace function public.search_marketplace_jobs_by_country(
  p_country_code text,
  p_search text default '',
  p_city_code text default null,
  p_budget_type public.budget_type default null,
  p_minimum_budget_cents integer default null,
  p_maximum_budget_cents integer default null,
  p_minimum_size integer default null,
  p_same_day_turnover boolean default false,
  p_supplies_provided boolean default false,
  p_weekend_only boolean default false,
  p_urgent_only boolean default false,
  p_preferred_date date default null,
  p_status public.job_status default null,
  p_sort text default 'relevance',
  p_page_size integer default 20,
  p_page_offset integer default 0,
  p_owner_id uuid default null
)
returns table (entity_id uuid, search_rank double precision, total_count bigint)
language sql stable security invoker set search_path = ''
as $$
  with ranked as (
    select job.id as entity_id,
      case
        when trim(public.normalize_search_text(p_search)) = '' then 0::double precision
        else greatest(
          extensions.similarity(job.search_text, public.normalize_search_text(p_search)) * 20,
          extensions.similarity(public.normalize_search_text(city.name), public.normalize_search_text(p_search)) * 18
        )::double precision
      end as search_rank,
      job.created_at, job.preferred_date, job.proposed_budget_cents
    from public.jobs job
    join public.cities city on city.code = job.city_code
    join public.job_services services on services.job_id = job.id
    where job.country_code = p_country_code
      and (
        (p_owner_id is null and job.status in ('published', 'receiving_offers'))
        or (p_owner_id is not null and job.owner_id = p_owner_id
          and (auth.uid() = p_owner_id or public.is_admin()))
      )
      and (trim(public.normalize_search_text(p_search)) = ''
        or job.search_text like '%' || public.normalize_search_text(p_search) || '%'
        or public.normalize_search_text(city.name) like '%' || public.normalize_search_text(p_search) || '%')
      and (p_city_code is null or job.city_code = p_city_code)
      and (p_budget_type is null or job.budget_type = p_budget_type)
      and (p_minimum_budget_cents is null or job.proposed_budget_cents >= p_minimum_budget_cents)
      and (p_maximum_budget_cents is null or job.proposed_budget_cents <= p_maximum_budget_cents)
      and (p_minimum_size is null or job.size_square_meters >= p_minimum_size)
      and (not p_same_day_turnover or services.same_day_turnover)
      and (not p_supplies_provided or services.cleaning_supplies_provided)
      and (not p_weekend_only or extract(isodow from job.preferred_date) in (6, 7))
      and (not p_urgent_only or job.is_urgent)
      and (p_preferred_date is null or job.preferred_date = p_preferred_date)
      and (p_status is null or job.status = p_status)
  ), counted as (
    select ranked.*, count(*) over () as total_count from ranked
  )
  select entity_id, search_rank, total_count
  from counted
  order by
    case when p_sort = 'relevance' then search_rank end desc,
    case when p_sort = 'date' then preferred_date end asc,
    case when p_sort = 'budget-high' then proposed_budget_cents end desc,
    case when p_sort = 'budget-low' then proposed_budget_cents end asc,
    created_at desc, entity_id
  limit least(greatest(p_page_size, 1), 100)
  offset greatest(p_page_offset, 0);
$$;

create or replace function public.search_marketplace_cleaners_by_country(
  p_country_code text,
  p_search text default '',
  p_city_code text default null,
  p_maximum_hourly_rate_cents integer default null,
  p_maximum_minimum_price_cents integer default null,
  p_minimum_rating numeric default null,
  p_weekend_available boolean default false,
  p_same_day_available boolean default false,
  p_brings_supplies boolean default false,
  p_own_transportation boolean default false,
  p_language text default null,
  p_sort text default 'relevance',
  p_page_size integer default 20,
  p_page_offset integer default 0
)
returns table (entity_id uuid, search_rank double precision, total_count bigint)
language sql stable security invoker set search_path = ''
as $$
  with rating_stats as (
    select reviewee_id, avg(overall_score) as average_rating, count(*) as review_count
    from public.reviews where verified_completed_job group by reviewee_id
  ), ranked as (
    select profile.id as entity_id,
      case
        when trim(public.normalize_search_text(p_search)) = '' then 0::double precision
        else greatest(
          extensions.similarity(profile.search_text, public.normalize_search_text(p_search)) * 20,
          extensions.similarity(cleaner.search_text, public.normalize_search_text(p_search)) * 16,
          extensions.similarity(public.normalize_search_text(city.name), public.normalize_search_text(p_search)) * 18
        )::double precision
      end as search_rank,
      cleaner.hourly_rate_cents,
      coalesce(ratings.average_rating, 0) as average_rating,
      coalesce(ratings.review_count, 0) as completed_count,
      profile.created_at
    from public.profiles profile
    join public.cleaner_profiles cleaner on cleaner.user_id = profile.id
    join public.cities city on city.code = profile.city_code
    left join rating_stats ratings on ratings.reviewee_id = profile.id
    where profile.role = 'cleaner'
      and profile.status = 'active'
      and profile.onboarding_completed
      and profile.country_code = p_country_code
      and (trim(public.normalize_search_text(p_search)) = ''
        or profile.search_text like '%' || public.normalize_search_text(p_search) || '%'
        or cleaner.search_text like '%' || public.normalize_search_text(p_search) || '%'
        or public.normalize_search_text(city.name) like '%' || public.normalize_search_text(p_search) || '%')
      and (p_city_code is null or profile.city_code = p_city_code or exists (
        select 1 from public.cleaner_service_areas area
        where area.cleaner_id = profile.id and area.city_code = p_city_code
      ))
      and (p_maximum_hourly_rate_cents is null or cleaner.hourly_rate_cents <= p_maximum_hourly_rate_cents)
      and (p_maximum_minimum_price_cents is null or cleaner.minimum_job_price_cents <= p_maximum_minimum_price_cents)
      and (p_minimum_rating is null or coalesce(ratings.average_rating, 0) >= p_minimum_rating)
      and (not p_weekend_available or cleaner.weekend_available)
      and (not p_same_day_available or cleaner.same_day_available)
      and (not p_brings_supplies or cleaner.brings_supplies)
      and (not p_own_transportation or cleaner.own_transportation)
      and (p_language is null or exists (
        select 1 from public.cleaner_languages language
        where language.cleaner_id = profile.id and language.language_code = p_language
      ))
  ), counted as (
    select ranked.*, count(*) over () as total_count from ranked
  )
  select entity_id, search_rank, total_count
  from counted
  order by
    case when p_sort = 'relevance' then search_rank end desc,
    case when p_sort = 'rating' then average_rating end desc,
    case when p_sort = 'rate' then hourly_rate_cents end asc,
    case when p_sort = 'completed' then completed_count end desc,
    case when p_sort = 'newest' then created_at end desc,
    search_rank desc, entity_id
  limit least(greatest(p_page_size, 1), 100)
  offset greatest(p_page_offset, 0);
$$;

revoke all on function public.search_marketplace_jobs_by_country(
  text, text, text, public.budget_type, integer, integer, integer, boolean, boolean,
  boolean, boolean, date, public.job_status, text, integer, integer, uuid
) from public;
revoke all on function public.search_marketplace_cleaners_by_country(
  text, text, text, integer, integer, numeric, boolean, boolean, boolean, boolean,
  text, text, integer, integer
) from public;

grant execute on function public.search_marketplace_jobs_by_country(
  text, text, text, public.budget_type, integer, integer, integer, boolean, boolean,
  boolean, boolean, date, public.job_status, text, integer, integer, uuid
) to anon, authenticated;
grant execute on function public.search_marketplace_cleaners_by_country(
  text, text, text, integer, integer, numeric, boolean, boolean, boolean, boolean,
  text, text, integer, integer
) to anon, authenticated;
