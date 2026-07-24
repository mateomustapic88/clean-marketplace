alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.owner_profiles enable row level security;
alter table public.owner_private_details enable row level security;
alter table public.cleaner_profiles enable row level security;
alter table public.cleaner_private_details enable row level security;
alter table public.cleaner_service_areas enable row level security;
alter table public.cleaner_languages enable row level security;
alter table public.cleaner_availability enable row level security;
alter table public.cleaner_availability_ranges enable row level security;

create policy cities_read on public.cities for select using (true);
create policy cities_admin_write on public.cities for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy profiles_public_read on public.profiles for select using (true);
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.current_user_role());
create policy profile_private_self on public.profile_private for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy profile_private_self_update on public.profile_private for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy preferences_self on public.notification_preferences for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy preferences_self_update on public.notification_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy owner_profiles_read on public.owner_profiles for select using (true);
create policy owner_profiles_self_update on public.owner_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.current_user_role() = 'owner');
create policy owner_private_self on public.owner_private_details for all to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() and public.current_user_role() = 'owner');
create policy cleaner_profiles_read on public.cleaner_profiles for select using (true);
create policy cleaner_profiles_self_update on public.cleaner_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.current_user_role() = 'cleaner');
create policy cleaner_private_self on public.cleaner_private_details for all to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() and public.current_user_role() = 'cleaner');
create policy service_areas_read on public.cleaner_service_areas for select using (true);
create policy service_areas_self_write on public.cleaner_service_areas for all to authenticated
  using (cleaner_id = auth.uid()) with check (cleaner_id = auth.uid() and public.current_user_role() = 'cleaner');
create policy languages_read on public.cleaner_languages for select using (true);
create policy languages_self_write on public.cleaner_languages for all to authenticated
  using (cleaner_id = auth.uid()) with check (cleaner_id = auth.uid() and public.current_user_role() = 'cleaner');
create policy availability_read on public.cleaner_availability for select using (true);
create policy availability_self_write on public.cleaner_availability for all to authenticated
  using (cleaner_id = auth.uid()) with check (cleaner_id = auth.uid() and public.current_user_role() = 'cleaner');
create policy availability_ranges_read on public.cleaner_availability_ranges for select using (true);
create policy availability_ranges_self_write on public.cleaner_availability_ranges for all to authenticated
  using (exists(select 1 from public.cleaner_availability a where a.id = availability_id and a.cleaner_id = auth.uid()))
  with check (exists(select 1 from public.cleaner_availability a where a.id = availability_id and a.cleaner_id = auth.uid()));
