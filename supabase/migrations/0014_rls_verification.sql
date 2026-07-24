do $$
declare missing_tables text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into missing_tables
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'spatial_ref_sys' and not c.relrowsecurity;
  if missing_tables is not null then raise exception 'RLS is not enabled for: %', missing_tables; end if;
end $$;

do $$
begin
  if exists(
    select 1 from pg_policies where schemaname = 'public'
      and tablename in ('subscriptions', 'stripe_events', 'audit_logs')
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and ('anon' = any(roles) or 'authenticated' = any(roles))
  ) then raise exception 'Privileged billing/audit tables expose a client write policy'; end if;
end $$;

-- Runtime verification examples for CI/local Supabase:
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<owner uuid>';
-- select * from public.job_private_locations where job_id = '<unrelated job uuid>'; -- zero rows
-- select public.accept_offer('<other owner job>', '<offer>'); -- must raise 42501
-- set local role anon; insert into public.feedback (...) values (...); -- must be denied
