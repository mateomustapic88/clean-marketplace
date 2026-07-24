begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'owner-one@test.clean.hr', crypt('Test1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"owner","first_name":"Ana","last_name":"Vlasnik","city_code":"zagreb"}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'owner-two@test.clean.hr', crypt('Test1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"owner","first_name":"Ivo","last_name":"Drugi","city_code":"split"}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'cleaner@test.clean.hr', crypt('Test1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"cleaner","first_name":"Mia","last_name":"Čistač","city_code":"zagreb"}', now(), now()
  );

insert into public.subscriptions (
  user_id, plan, status, unit_amount_cents, trial_started_at, trial_ends_at, trial_consumed
) values
  ('10000000-0000-0000-0000-000000000001', 'owner', 'trial', 1900, now(), now() + interval '7 days', true),
  ('10000000-0000-0000-0000-000000000002', 'owner', 'trial', 1900, now(), now() + interval '7 days', true),
  ('20000000-0000-0000-0000-000000000001', 'cleaner', 'trial', 3900, now(), now() + interval '7 days', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(public.has_entitlement('owner'), 'owner has an active entitlement');

insert into public.jobs (
  id, owner_id, title, apartment_name, city_code, approximate_area,
  size_square_meters, bedrooms, bathrooms, beds, guest_capacity,
  estimated_duration_hours, preferred_date, preferred_start_time,
  proposed_budget_cents, budget_type, offer_deadline, status
) values (
  '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
  'Čišćenje apartmana', 'Apartman Centar', 'zagreb', 'Centar',
  55, 1, 1, 2, 4, 3, current_date + 10, '10:00', 7500, 'fixed',
  now() + interval '5 days', 'published'
);
insert into public.job_private_locations (job_id, exact_address)
values ('30000000-0000-0000-0000-000000000001', 'Ilica 10, Zagreb');
insert into public.job_services (job_id, linen_replacement)
values ('30000000-0000-0000-0000-000000000001', true);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
insert into public.offers (
  id, job_id, cleaner_id, proposed_price_cents, price_type,
  estimated_duration_hours, available_arrival_time, message, expires_at
) values (
  '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', 7000, 'fixed', 3,
  now() + interval '9 days', 'Mogu preuzeti posao.', now() + interval '4 days'
);

select is(
  (select count(*)::integer from public.job_private_locations where job_id = '30000000-0000-0000-0000-000000000001'),
  0,
  'cleaner cannot see the exact address before assignment'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
update public.jobs set title = 'Neovlaštena promjena' where id = '30000000-0000-0000-0000-000000000001';
select is(
  (select title from public.jobs where id = '30000000-0000-0000-0000-000000000001'),
  'Čišćenje apartmana',
  'a different owner cannot update the job'
);
select is(
  (select count(*)::integer from public.job_private_locations where job_id = '30000000-0000-0000-0000-000000000001'),
  0,
  'a different owner cannot see the exact address'
);
select throws_ok(
  $$ select public.accept_offer('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001') $$,
  '42501',
  'Not authorized',
  'a different owner cannot accept an offer'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$ select public.accept_offer('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001') $$,
  'the job owner can accept the offer transactionally'
);
select is(
  (select assigned_cleaner_id from public.jobs where id = '30000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid,
  'accepting the offer assigns its cleaner'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select is(
  (select exact_address from public.job_private_locations where job_id = '30000000-0000-0000-0000-000000000001'),
  'Ilica 10, Zagreb',
  'the assigned cleaner can see the exact address'
);

reset role;
insert into public.stripe_events (stripe_event_id, event_type, event_created_at)
values ('evt_rls_idempotency', 'customer.subscription.updated', now());
select throws_ok(
  $$ insert into public.stripe_events (stripe_event_id, event_type, event_created_at)
     values ('evt_rls_idempotency', 'customer.subscription.updated', now()) $$,
  '23505',
  'duplicate key value violates unique constraint "stripe_events_pkey"',
  'Stripe event claims are durable and idempotent'
);

select * from finish();
rollback;
