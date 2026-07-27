create or replace view public.marketplace_cleaners with (security_invoker = true) as
select p.id, p.first_name, p.last_name, p.display_name, p.avatar_path, p.city_code, p.bio, p.is_demo,
  cp.hourly_rate_cents, cp.minimum_job_price_cents, cp.service_radius_km, cp.years_of_experience,
  cp.biography, cp.company_name, cp.website, cp.own_transportation, cp.brings_supplies,
  cp.same_day_available, cp.weekend_available, cp.vacation_mode, cp.verified, p.created_at, p.updated_at
from public.profiles p
join public.cleaner_profiles cp on cp.user_id = p.id
where p.role = 'cleaner'
  and p.status = 'active'
  and p.onboarding_completed;

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
    and profile.onboarding_completed
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
