create or replace view public.marketplace_cleaners with (security_invoker = true) as
select p.id, p.first_name, p.last_name, p.display_name, p.avatar_path, p.city_code, p.bio, p.is_demo,
  cp.hourly_rate_cents, cp.minimum_job_price_cents, cp.service_radius_km, cp.years_of_experience,
  cp.biography, cp.company_name, cp.website, cp.own_transportation, cp.brings_supplies,
  cp.same_day_available, cp.weekend_available, cp.vacation_mode, cp.verified, p.created_at, p.updated_at
from public.profiles p join public.cleaner_profiles cp on cp.user_id = p.id
where p.role = 'cleaner' and p.status = 'active';

create or replace view public.marketplace_jobs with (security_invoker = true) as
select j.id, j.owner_id, j.title, j.apartment_name, j.city_code, j.approximate_area,
  j.size_square_meters, j.bedrooms, j.bathrooms, j.beds, j.guest_capacity,
  j.estimated_duration_hours, j.preferred_date, j.preferred_start_time, j.flexible_time,
  j.proposed_budget_cents, j.budget_type, j.additional_instructions, j.offer_deadline,
  j.status, j.is_urgent, j.is_demo, j.created_at, j.updated_at
from public.jobs j where j.status in ('published', 'receiving_offers');

revoke all on public.marketplace_cleaners, public.marketplace_jobs from public;
grant select on public.marketplace_cleaners, public.marketplace_jobs to anon, authenticated;
