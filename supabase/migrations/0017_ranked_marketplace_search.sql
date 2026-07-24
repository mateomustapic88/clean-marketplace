create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.normalize_search_text(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent(coalesce(value, '')));
$$;

create or replace function public.prefix_search_query(value text)
returns tsquery
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when trim(public.normalize_search_text(value)) = '' then null
    else to_tsquery(
      'simple'::regconfig,
      (
        select string_agg(token || ':*', ' & ')
        from regexp_split_to_table(
          regexp_replace(public.normalize_search_text(value), '[^a-z0-9]+', ' ', 'g'),
          '\s+'
        ) as token
        where token <> ''
      )
    )
  end;
$$;

alter table public.jobs
  add column search_text text generated always as (
    public.normalize_search_text(
      title || ' ' || apartment_name || ' ' || city_code || ' '
      || approximate_area || ' ' || additional_instructions
    )
  ) stored;

alter table public.profiles
  add column search_text text generated always as (
    public.normalize_search_text(
      first_name || ' ' || last_name || ' '
      || coalesce(city_code, '') || ' ' || bio
    )
  ) stored;

alter table public.cleaner_profiles
  add column search_text text generated always as (
    public.normalize_search_text(
      biography || ' ' || coalesce(company_name, '') || ' ' || coalesce(website, '')
    )
  ) stored;

create index jobs_search_trgm_idx
  on public.jobs using gin (search_text extensions.gin_trgm_ops);
create index jobs_search_fts_idx
  on public.jobs using gin (to_tsvector('simple'::regconfig, search_text));
create index profiles_search_trgm_idx
  on public.profiles using gin (search_text extensions.gin_trgm_ops);
create index profiles_search_fts_idx
  on public.profiles using gin (to_tsvector('simple'::regconfig, search_text));
create index cleaner_profiles_search_trgm_idx
  on public.cleaner_profiles using gin (search_text extensions.gin_trgm_ops);
create index cleaner_profiles_search_fts_idx
  on public.cleaner_profiles using gin (to_tsvector('simple'::regconfig, search_text));
create index cities_name_search_trgm_idx
  on public.cities using gin (public.normalize_search_text(name) extensions.gin_trgm_ops);
create index job_private_locations_search_trgm_idx
  on public.job_private_locations using gin (
    public.normalize_search_text(exact_address) extensions.gin_trgm_ops
  );
create index cleaner_service_areas_city_idx
  on public.cleaner_service_areas (city_code, cleaner_id);
create index cleaner_languages_language_idx
  on public.cleaner_languages (language_code, cleaner_id);

create or replace function public.search_marketplace_jobs(
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
returns table (
  entity_id uuid,
  search_rank double precision,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with search_parameters as (
    select
      trim(public.normalize_search_text(p_search)) as query,
      public.prefix_search_query(p_search) as ts_query,
      least(greatest(p_page_size, 1), 100) as result_limit,
      greatest(p_page_offset, 0) as result_offset
  ),
  ranked as (
    select
      job.id as entity_id,
      (
        case when parameters.query = '' then 0
          when public.normalize_search_text(job.title) = parameters.query then 120
          when public.normalize_search_text(job.apartment_name) = parameters.query then 100
          when public.normalize_search_text(city.name) = parameters.query
            or job.city_code = parameters.query then 90
          when public.normalize_search_text(job.title) like parameters.query || '%' then 70
          when public.normalize_search_text(job.apartment_name) like parameters.query || '%' then 60
          when public.normalize_search_text(city.name) like parameters.query || '%'
            or job.city_code like parameters.query || '%' then 55
          else 0
        end
        + coalesce(
          ts_rank_cd(
            to_tsvector('simple'::regconfig, job.search_text),
            parameters.ts_query,
            32
          ) * 40,
          0
        )
        + greatest(
          extensions.similarity(job.search_text, parameters.query) * 20,
          extensions.similarity(public.normalize_search_text(city.name), parameters.query) * 18,
          coalesce(
            extensions.similarity(
              public.normalize_search_text(private_location.exact_address),
              parameters.query
            ) * 12,
            0
          )
        )
      )::double precision as search_rank,
      job.created_at,
      job.preferred_date,
      job.proposed_budget_cents
    from public.jobs as job
    join public.cities as city on city.code = job.city_code
    join public.job_services as services on services.job_id = job.id
    left join public.job_private_locations as private_location
      on private_location.job_id = job.id
    cross join search_parameters as parameters
    where (
      (p_owner_id is null and job.status in ('published', 'receiving_offers'))
      or (
        p_owner_id is not null
        and job.owner_id = p_owner_id
        and (auth.uid() = p_owner_id or public.is_admin())
      )
    )
    and (
      parameters.query = ''
      or job.search_text like '%' || parameters.query || '%'
      or to_tsvector('simple'::regconfig, job.search_text) @@ parameters.ts_query
      or job.search_text operator(extensions.%) parameters.query
      or public.normalize_search_text(city.name) like '%' || parameters.query || '%'
      or public.normalize_search_text(city.name) operator(extensions.%) parameters.query
      or public.normalize_search_text(private_location.exact_address)
        like '%' || parameters.query || '%'
    )
    and (p_city_code is null or job.city_code = p_city_code)
    and (p_budget_type is null or job.budget_type = p_budget_type)
    and (
      p_minimum_budget_cents is null
      or job.proposed_budget_cents >= p_minimum_budget_cents
    )
    and (
      p_maximum_budget_cents is null
      or job.proposed_budget_cents <= p_maximum_budget_cents
    )
    and (p_minimum_size is null or job.size_square_meters >= p_minimum_size)
    and (not p_same_day_turnover or services.same_day_turnover)
    and (not p_supplies_provided or services.cleaning_supplies_provided)
    and (
      not p_weekend_only
      or extract(isodow from job.preferred_date) in (6, 7)
    )
    and (not p_urgent_only or job.is_urgent)
    and (p_preferred_date is null or job.preferred_date = p_preferred_date)
    and (p_status is null or job.status = p_status)
  ),
  counted as (
    select ranked.*, count(*) over () as total_count
    from ranked
  )
  select counted.entity_id, counted.search_rank, counted.total_count
  from counted
  cross join search_parameters as parameters
  order by
    case when p_sort = 'relevance' then counted.search_rank end desc,
    case when p_sort = 'date' then counted.preferred_date end asc,
    case when p_sort = 'budget-high' then counted.proposed_budget_cents end desc,
    case when p_sort = 'budget-low' then counted.proposed_budget_cents end asc,
    counted.created_at desc,
    counted.entity_id
  limit (select result_limit from search_parameters)
  offset (select result_offset from search_parameters);
$$;

create or replace function public.search_marketplace_cleaners(
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
returns table (
  entity_id uuid,
  search_rank double precision,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with search_parameters as (
    select
      trim(public.normalize_search_text(p_search)) as query,
      public.prefix_search_query(p_search) as ts_query,
      least(greatest(p_page_size, 1), 100) as result_limit,
      greatest(p_page_offset, 0) as result_offset
  ),
  rating_stats as (
    select
      review.reviewee_id,
      avg(review.overall_score) as average_rating,
      count(*) as review_count
    from public.reviews as review
    where review.verified_completed_job
    group by review.reviewee_id
  ),
  ranked as (
    select
      profile.id as entity_id,
      (
        case when parameters.query = '' then 0
          when public.normalize_search_text(profile.display_name) = parameters.query then 120
          when public.normalize_search_text(cleaner.company_name) = parameters.query then 100
          when public.normalize_search_text(city.name) = parameters.query
            or profile.city_code = parameters.query then 90
          when public.normalize_search_text(profile.display_name)
            like parameters.query || '%' then 70
          when public.normalize_search_text(cleaner.company_name)
            like parameters.query || '%' then 60
          when public.normalize_search_text(city.name) like parameters.query || '%'
            or profile.city_code like parameters.query || '%' then 55
          else 0
        end
        + coalesce(
          ts_rank_cd(
            to_tsvector(
              'simple'::regconfig,
              profile.search_text || ' ' || cleaner.search_text
            ),
            parameters.ts_query,
            32
          ) * 40,
          0
        )
        + greatest(
          extensions.similarity(profile.search_text, parameters.query) * 20,
          extensions.similarity(cleaner.search_text, parameters.query) * 16,
          extensions.similarity(
            public.normalize_search_text(city.name),
            parameters.query
          ) * 18,
          extensions.similarity(coalesce(service_areas.search_text, ''), parameters.query) * 14
        )
      )::double precision as search_rank,
      cleaner.hourly_rate_cents,
      coalesce(ratings.average_rating, 0) as average_rating,
      coalesce(ratings.review_count, 0) as completed_count,
      profile.created_at
    from public.profiles as profile
    join public.cleaner_profiles as cleaner on cleaner.user_id = profile.id
    join public.cities as city on city.code = profile.city_code
    left join rating_stats as ratings on ratings.reviewee_id = profile.id
    left join lateral (
      select public.normalize_search_text(
        string_agg(area.city_code || ' ' || area_city.name, ' ')
      ) as search_text
      from public.cleaner_service_areas as area
      join public.cities as area_city on area_city.code = area.city_code
      where area.cleaner_id = profile.id
    ) as service_areas on true
    left join lateral (
      select string_agg(language.language_code, ' ') as search_text
      from public.cleaner_languages as language
      where language.cleaner_id = profile.id
    ) as languages on true
    cross join search_parameters as parameters
    where profile.role = 'cleaner'
    and profile.status = 'active'
    and (
      parameters.query = ''
      or profile.search_text like '%' || parameters.query || '%'
      or cleaner.search_text like '%' || parameters.query || '%'
      or to_tsvector(
        'simple'::regconfig,
        profile.search_text || ' ' || cleaner.search_text
      ) @@ parameters.ts_query
      or profile.search_text operator(extensions.%) parameters.query
      or cleaner.search_text operator(extensions.%) parameters.query
      or public.normalize_search_text(city.name) like '%' || parameters.query || '%'
      or public.normalize_search_text(city.name) operator(extensions.%) parameters.query
      or coalesce(service_areas.search_text, '') like '%' || parameters.query || '%'
      or coalesce(languages.search_text, '') like '%' || parameters.query || '%'
    )
    and (
      p_city_code is null
      or profile.city_code = p_city_code
      or exists (
        select 1
        from public.cleaner_service_areas as area
        where area.cleaner_id = profile.id
          and area.city_code = p_city_code
      )
    )
    and (
      p_maximum_hourly_rate_cents is null
      or cleaner.hourly_rate_cents <= p_maximum_hourly_rate_cents
    )
    and (
      p_maximum_minimum_price_cents is null
      or cleaner.minimum_job_price_cents <= p_maximum_minimum_price_cents
    )
    and (
      p_minimum_rating is null
      or coalesce(ratings.average_rating, 0) >= p_minimum_rating
    )
    and (not p_weekend_available or cleaner.weekend_available)
    and (not p_same_day_available or cleaner.same_day_available)
    and (not p_brings_supplies or cleaner.brings_supplies)
    and (not p_own_transportation or cleaner.own_transportation)
    and (
      p_language is null
      or exists (
        select 1
        from public.cleaner_languages as language
        where language.cleaner_id = profile.id
          and language.language_code = p_language
      )
    )
  ),
  counted as (
    select ranked.*, count(*) over () as total_count
    from ranked
  )
  select counted.entity_id, counted.search_rank, counted.total_count
  from counted
  cross join search_parameters as parameters
  order by
    case when p_sort = 'relevance' then counted.search_rank end desc,
    case when p_sort = 'rating' then counted.average_rating end desc,
    case when p_sort = 'rate' then counted.hourly_rate_cents end asc,
    case when p_sort = 'completed' then counted.completed_count end desc,
    case when p_sort = 'newest' then counted.created_at end desc,
    counted.search_rank desc,
    counted.entity_id
  limit (select result_limit from search_parameters)
  offset (select result_offset from search_parameters);
$$;

revoke all on function public.normalize_search_text(text) from public;
revoke all on function public.prefix_search_query(text) from public;
revoke all on function public.search_marketplace_jobs(
  text, text, public.budget_type, integer, integer, integer, boolean, boolean,
  boolean, boolean, date, public.job_status, text, integer, integer, uuid
) from public;
revoke all on function public.search_marketplace_cleaners(
  text, text, integer, integer, numeric, boolean, boolean, boolean, boolean,
  text, text, integer, integer
) from public;

grant execute on function public.normalize_search_text(text) to anon, authenticated;
grant execute on function public.prefix_search_query(text) to anon, authenticated;
grant execute on function public.search_marketplace_jobs(
  text, text, public.budget_type, integer, integer, integer, boolean, boolean,
  boolean, boolean, date, public.job_status, text, integer, integer, uuid
) to anon, authenticated;
grant execute on function public.search_marketplace_cleaners(
  text, text, integer, integer, numeric, boolean, boolean, boolean, boolean,
  text, text, integer, integer
) to anon, authenticated;
