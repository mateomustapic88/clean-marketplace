alter table public.profile_private
  drop constraint if exists profile_private_preferred_language_check;

alter table public.profile_private
  add constraint profile_private_preferred_language_check
  check (preferred_language in ('hr', 'en', 'sl'));
