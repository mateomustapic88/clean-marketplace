alter table public.subscriptions enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.payment_methods enable row level security;
alter table public.stripe_events enable row level security;
alter table public.feedback enable row level security;
alter table public.audit_logs enable row level security;
alter table public.request_rate_limits enable row level security;

create policy subscriptions_self_read on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy invoices_self_read on public.billing_invoices for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy payment_methods_self_read on public.payment_methods for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy feedback_authenticated_insert on public.feedback for insert to authenticated with check (user_id = auth.uid());
create policy feedback_admin_read on public.feedback for select to authenticated using (public.is_admin());
create policy feedback_admin_update on public.feedback for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_admin());
revoke all on public.stripe_events from anon, authenticated;
revoke insert, update, delete on public.subscriptions, public.billing_invoices, public.payment_methods from anon, authenticated;
revoke all on public.audit_logs from anon;
revoke all on public.request_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  target_scope text, target_key_hash text, target_limit integer, target_window_seconds integer
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare current_count integer;
begin
  insert into public.request_rate_limits(scope, key_hash, window_started_at, request_count)
  values(target_scope, target_key_hash, timezone('utc', now()), 1)
  on conflict (scope, key_hash) do update set
    request_count = case
      when public.request_rate_limits.window_started_at + make_interval(secs => target_window_seconds) <= timezone('utc', now()) then 1
      else public.request_rate_limits.request_count + 1 end,
    window_started_at = case
      when public.request_rate_limits.window_started_at + make_interval(secs => target_window_seconds) <= timezone('utc', now()) then timezone('utc', now())
      else public.request_rate_limits.window_started_at end,
    updated_at = timezone('utc', now())
  returning request_count into current_count;
  return current_count <= target_limit;
end; $$;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
