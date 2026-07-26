insert into public.cities (code, name, county)
values ('makarska', 'Makarska', 'Splitsko-dalmatinska')
on conflict (code) do update
set
  name = excluded.name,
  county = excluded.county,
  updated_at = timezone('utc', now());
