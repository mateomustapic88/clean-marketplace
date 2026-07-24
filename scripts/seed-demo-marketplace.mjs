import { randomBytes } from 'node:crypto'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const DEMO_OWNER_EMAIL = 'demo-owner@seed.clean-marketplace.com'
const DEMO_SEED_KEY = 'clean-marketplace-public-demo-v1'
const JOB_ID_PREFIX = 'd3000000-0000-4000-8000-0000000000'
const REVIEW_ID_PREFIX = 'd4000000-0000-4000-8000-0000000000'

const cleanerNames = [
  ['Marija', 'Knežević'], ['Ivana', 'Barišić'], ['Sandra', 'Milić'], ['Jelena', 'Tomić'],
  ['Martina', 'Lončar'], ['Kristina', 'Kralj'], ['Andrea', 'Ilić'], ['Nina', 'Petrović'],
  ['Antonija', 'Župan'], ['Renata', 'Katić'], ['Dora', 'Blažević'], ['Mirjana', 'Klarić'],
  ['Tanja', 'Rukavina'], ['Vesna', 'Đurić'], ['Valentina', 'Brkić'], ['Irena', 'Mandić'],
  ['Gabrijela', 'Soldo'], ['Lorena', 'Pranjić'], ['Ema', 'Vidak'], ['Helena', 'Lukić'],
  ['Sara', 'Krpan'], ['Ines', 'Jakovljević'], ['Paula', 'Mikulić'], ['Monika', 'Erceg'],
  ['Tamara', 'Varga'], ['Danijela', 'Bašić'], ['Karla', 'Vukelić'], ['Lea', 'Magaš'],
  ['Barbara', 'Pavlović'], ['Mateja', 'Cindrić'], ['Anita', 'Kovačević'], ['Mirela', 'Bilić'],
  ['Zrinka', 'Lovrić'], ['Silvija', 'Šimić'], ['Tea', 'Ćosić'], ['Ksenija', 'Kordić'],
  ['Natali', 'Maretić'], ['Matea', 'Jukić'], ['Josipa', 'Benković'], ['Lucija', 'Vučković'],
]

const locations = [
  { cityCode: 'dubrovnik', area: 'Lapad', label: 'Dubrovnik' },
  { cityCode: 'dubrovnik', area: 'Cavtat, u blizini rive', label: 'Cavtat' },
  { cityCode: 'zagreb', area: 'Donji grad', label: 'Zagreb' },
  { cityCode: 'split', area: 'Bačvice', label: 'Split' },
  { cityCode: 'zadar', area: 'Poluotok', label: 'Zadar' },
  { cityCode: 'sibenik', area: 'Brodarica', label: 'Šibenik' },
  { cityCode: 'split', area: 'Makarska, centar', label: 'Makarska' },
  { cityCode: 'rijeka', area: 'Trsat', label: 'Rijeka' },
  { cityCode: 'pula', area: 'Verudela', label: 'Pula' },
  { cityCode: 'pula', area: 'Rovinj, stari grad', label: 'Rovinj' },
]

const biographies = [
  'Pouzdano i temeljito održavam turističke apartmane između smjena gostiju. Posebnu pažnju posvećujem kupaonicama, kuhinji i završnoj kontroli prostora.',
  'Imam iskustvo u redovitom čišćenju apartmana, vila i kuća za odmor. Poštujem dogovorene rokove i jasno komuniciram s vlasnicima.',
  'Organizirana sam i pedantna, dostupna za povremena i tjedna čišćenja. Mogu donijeti vlastita sredstva i prilagoditi se rasporedu gostiju.',
  'Specijalizirana sam za brze promjene gostiju, zamjenu posteljine i pripremu smještaja za check-in. Radim uredno i samostalno.',
  'Nudim detaljno čišćenje manjih i većih apartmana. Važni su mi pouzdanost, diskrecija i dosljedna kvaliteta usluge.',
  'Višegodišnje iskustvo stekla sam u hotelima i privatnom smještaju. Dostupna sam i vikendom uz prethodni dogovor.',
  'Brinem o apartmanu kao da je moj: provjeravam detalje, prijavljujem eventualna oštećenja i ostavljam prostor spreman za goste.',
  'Fokus mi je profesionalna priprema turističkog smještaja, uključujući kuhinju, balkone i pranje posteljine prema dogovoru.',
]

const jobTemplates = [
  ['Čišćenje apartmana nakon check-outa', 'Apartman Bonaca', 'Potrebno je kompletno čišćenje nakon odlaska četvero gostiju, zamjena posteljine i priprema kupaonice za novi dolazak.'],
  ['Tjedno čišćenje gradskog apartmana', 'Apartman Centar', 'Tražimo pouzdanu osobu za redovito tjedno čišćenje, usisavanje, pranje podova i održavanje kuhinje.'],
  ['Brza priprema studio apartmana', 'Studio Gornji grad', 'Studio treba očistiti između dvije rezervacije. Posteljina je pripremljena, a završetak je potreban prije check-ina.'],
  ['Čišćenje turističkog apartmana', 'Apartman Marjan', 'Standardna smjena gostiju uz čišćenje kuhinje, kupaonice, dvije spavaće sobe i terase.'],
  ['Detaljno čišćenje apartmana uz more', 'Apartman Kalelarga', 'Potrebno je detaljno sezonsko čišćenje, uključujući hladnjak, pećnicu i staklene površine.'],
  ['Priprema apartmana prije check-ina', 'Apartman Jadran', 'Gosti dolaze poslijepodne. Treba zamijeniti ručnike i posteljinu te provjeriti kuhinju i balkon.'],
  ['Redovito čišćenje apartmana', 'Apartman Biokovo', 'Tražimo suradnju dva puta tjedno tijekom sezone, uz mogućnost dodatnih termina po dogovoru.'],
  ['Čišćenje obiteljskog apartmana', 'Apartman Trsat', 'Nakon duljeg boravka potrebno je temeljito očistiti veći apartman s dvije kupaonice i balkonom.'],
  ['Čišćenje apartmana na Verudeli', 'Apartman Arena', 'Potrebno je standardno čišćenje nakon check-outa i priprema kreveta za sljedeću rezervaciju.'],
  ['Priprema luksuznog apartmana', 'Residence Rovinj', 'Traži se pedantna završna priprema, poliranje površina i provjera svih prostorija prije dolaska gostiju.'],
  ['Hitna smjena gostiju u vili', 'Villa Lovor', 'Zbog ranijeg dolaska gostiju potrebno je završiti čišćenje vile i bazenskog prostora u dogovorenom roku.'],
  ['Čišćenje malog studio apartmana', 'Studio Cavtat', 'Kratko čišćenje studija, kupaonice i čajne kuhinje te zamjena ručnika.'],
  ['Generalno čišćenje nakon dužeg najma', 'Apartman Maksimir', 'Nakon mjesečnog najma potrebno je temeljito čišćenje svih prostorija, prozora i kuhinjskih elemenata.'],
  ['Tjedno održavanje apartmana', 'Apartman Firule', 'Redovito održavanje dvosobnog apartmana jednom tjedno, po mogućnosti u prijepodnevnom terminu.'],
  ['Čišćenje prije večernjeg check-ina', 'Apartman Forum', 'Check-out je u 10 sati, a novi gosti dolaze u 17 sati. Potrebna je kompletna priprema smještaja.'],
  ['Završeno čišćenje turističkog apartmana', 'Apartman Sv. Jakov', 'Demonstracijski završeni posao čišćenja apartmana nakon odlaska gostiju.'],
  ['Završeno tjedno čišćenje', 'Apartman Trešnjevka', 'Demonstracijski završeni termin redovitog čišćenja gradskog apartmana.'],
  ['Završena priprema vile', 'Villa Maris', 'Demonstracijski završena priprema vile s četiri spavaće sobe i tri kupaonice.'],
  ['Završeno čišćenje studija', 'Studio Punta', 'Demonstracijski završena brza smjena gostiju u studio apartmanu.'],
  ['Završeno detaljno čišćenje', 'Apartman Lungomare', 'Demonstracijski završeno detaljno čišćenje apartmana uz more.'],
]

const toUuid = (prefix, index) => `${prefix}${String(index + 1).padStart(2, '0')}`
const dateOnly = (date) => date.toISOString().slice(0, 10)
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000)
const isoAt = (date, hours) => {
  const value = new Date(date)
  value.setUTCHours(hours, 0, 0, 0)
  return value.toISOString()
}

const cleaners = cleanerNames.map(([firstName, lastName], index) => {
  const primary = locations[index % locations.length]
  const secondary = locations[(index + 3) % locations.length]
  return {
    seedKey: `cleaner-${String(index + 1).padStart(2, '0')}`,
    email: `demo-cleaner-${String(index + 1).padStart(2, '0')}@seed.clean-marketplace.com`,
    firstName,
    lastName,
    cityCode: primary.cityCode,
    secondaryCityCode: secondary.cityCode,
    yearsOfExperience: 1 + (index % 14),
    hourlyRateCents: 1400 + (index % 10) * 100,
    minimumJobPriceCents: 3500 + (index % 6) * 500,
    serviceRadiusKm: 15 + (index % 5) * 5,
    languages: index % 7 === 0 ? ['hr', 'en', 'de'] : index % 5 === 0 ? ['hr', 'it'] : ['hr', 'en'],
    biography: biographies[index % biographies.length],
    ownTransportation: index % 5 !== 0,
    bringsSupplies: index % 3 !== 0,
    sameDayAvailable: index % 6 === 0,
    weekendAvailable: index % 2 === 0,
  }
})

const buildJobs = (ownerId, cleanerIds, now = new Date()) => jobTemplates.map((template, index) => {
  const [title, apartmentName, description] = template
  const completed = index >= 15
  const location = locations[index % locations.length]
  const preferredDate = addDays(now, completed ? -(index - 13) * 8 : 7 + index * 2)
  const cleanerId = completed ? cleanerIds[index - 15] : null
  const size = 28 + (index % 9) * 11
  return {
    id: toUuid(JOB_ID_PREFIX, index),
    owner_id: ownerId,
    assigned_cleaner_id: cleanerId,
    accepted_offer_id: null,
    title: `[DEMO] ${title}`,
    apartment_name: `[DEMO] ${apartmentName}`,
    city_code: location.cityCode,
    approximate_area: location.area,
    hide_exact_address: true,
    size_square_meters: size,
    bedrooms: index % 4,
    bathrooms: 1 + (index % 3),
    beds: 1 + (index % 6),
    guest_capacity: 2 + (index % 7),
    estimated_duration_hours: 1.5 + (index % 6) * 0.5,
    preferred_date: dateOnly(preferredDate),
    preferred_start_time: `${String(8 + (index % 7)).padStart(2, '0')}:00`,
    flexible_time: index % 3 === 0,
    proposed_budget_cents: 3500 + (index % 10) * 900,
    budget_type: index % 5 === 0 ? 'hourly' : 'fixed',
    additional_instructions: `[DEMO] ${description} ${index % 4 === 0 ? 'Molimo javiti ako je potreban dodatni termin.' : 'Točan dogovor potvrđujemo porukom.'}`,
    offer_deadline: isoAt(addDays(preferredDate, completed ? -10 : -2), 18),
    status: completed
      ? 'completed'
      : index % 3 === 0
        ? 'receiving_offers'
        : 'published',
    is_urgent: !completed && (index === 5 || index === 10 || index === 14),
    is_demo: true,
  }
})

const validateSeed = () => {
  const errors = []
  if (cleaners.length !== 40) errors.push(`Expected 40 cleaners, received ${cleaners.length}`)
  if (jobTemplates.length !== 20) errors.push(`Expected 20 jobs, received ${jobTemplates.length}`)
  if (new Set(cleaners.map(({ email }) => email)).size !== cleaners.length) errors.push('Cleaner emails must be unique')
  if (cleaners.some(({ firstName, lastName }) => !firstName || !lastName)) errors.push('Every cleaner requires a full name')
  if (jobTemplates.some(([title, apartmentName]) => !title || !apartmentName)) errors.push('Every job requires a title and apartment name')
  if (errors.length) throw new Error(errors.join('\n'))
}

const throwFor = (error, context) => {
  if (error) throw new Error(`${context}: ${error.message}`)
}

const listAuthUsers = async (authAdmin) => {
  const users = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await authAdmin.listUsers({ page, perPage: 1000 })
    throwFor(error, 'Could not inspect existing Auth users')
    users.push(...data.users)
    if (data.users.length < 1000) return users
  }
}

const ensureDemoAuthUser = async (authAdmin, existingByEmail, account) => {
  const existing = existingByEmail.get(account.email.toLowerCase())
  if (existing) {
    if (
      existing.user_metadata?.demo_seed !== DEMO_SEED_KEY
      || existing.user_metadata?.demo_seed_key !== account.seedKey
    ) {
      throw new Error(`Refusing to reuse non-seed Auth account: ${account.email}`)
    }
    return existing.id
  }

  const password = randomBytes(32).toString('base64url')
  const { data, error } = await authAdmin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: {
      demo_seed: DEMO_SEED_KEY,
      demo_seed_key: account.seedKey,
      role: account.role,
      first_name: `[DEMO] ${account.firstName}`,
      last_name: account.lastName,
      city_code: account.cityCode,
    },
  })
  throwFor(error, `Could not create demo Auth account ${account.email}`)
  if (!data.user) throw new Error(`Supabase did not return demo Auth account ${account.email}`)
  existingByEmail.set(account.email.toLowerCase(), data.user)
  return data.user.id
}

const seed = async () => {
  const configuredSupabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_JWT
    || process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY
  if (!configuredSupabaseUrl || !serviceRoleKey) {
    throw new Error('NUXT_PUBLIC_SUPABASE_URL and a Supabase service-role key are required')
  }
  if (serviceRoleKey.startsWith('sb_secret_')) {
    throw new Error(
      'This Auth Admin seed requires the project legacy service_role JWT. '
      + 'Provide it as SUPABASE_SERVICE_ROLE_JWT without changing the application environment.',
    )
  }
  const supabaseUrl = new URL(configuredSupabaseUrl).origin

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const authAdmin = client.auth.admin
  const existingUsers = await listAuthUsers(authAdmin)
  const existingByEmail = new Map(existingUsers.map((user) => [String(user.email).toLowerCase(), user]))
  const jobIds = jobTemplates.map((_, index) => toUuid(JOB_ID_PREFIX, index))
  const { data: existingJobs, error: existingJobsError } = await client
    .from('jobs').select('id, is_demo').in('id', jobIds)
  throwFor(existingJobsError, 'Could not inspect existing jobs')
  if (existingJobs?.some((job) => !job.is_demo)) {
    throw new Error('Refusing to overwrite a non-demo job with a reserved seed identifier')
  }

  const accounts = [
    {
      seedKey: 'owner', email: DEMO_OWNER_EMAIL, firstName: 'Clean', lastName: 'Demo vlasnik',
      cityCode: 'dubrovnik', role: 'owner',
    },
    ...cleaners.map((cleaner) => ({ ...cleaner, role: 'cleaner' })),
  ]

  const accountIds = new Map()
  for (const account of accounts) {
    accountIds.set(account.seedKey, await ensureDemoAuthUser(authAdmin, existingByEmail, account))
  }

  const ownerId = accountIds.get('owner')
  const cleanerIds = cleaners.map((cleaner) => accountIds.get(cleaner.seedKey))
  if (!ownerId || cleanerIds.some((id) => !id)) throw new Error('Demo account identifiers could not be resolved')

  const profileRows = accounts.map((account) => ({
    id: accountIds.get(account.seedKey),
    role: account.role,
    status: 'active',
    first_name: `[DEMO] ${account.firstName}`,
    last_name: account.lastName,
    city_code: account.cityCode,
    bio: account.role === 'cleaner' ? `[DEMO] ${account.biography}` : '[DEMO] Profil vlasnika demonstracijskih oglasa.',
    onboarding_completed: true,
    is_demo: true,
  }))
  const { error: profilesError } = await client.from('profiles').upsert(profileRows, { onConflict: 'id' })
  throwFor(profilesError, 'Could not upsert demo profiles')

  const { error: ownerError } = await client.from('owner_profiles').upsert({
    user_id: ownerId,
    company_name: '[DEMO] Clean Marketplace',
    agency_name: null,
    apartment_name: '[DEMO] Demo smještaji Hrvatska',
    apartment_city_code: 'dubrovnik',
  }, { onConflict: 'user_id' })
  throwFor(ownerError, 'Could not upsert demo owner profile')

  const cleanerRows = cleaners.map((cleaner) => ({
    user_id: accountIds.get(cleaner.seedKey),
    hourly_rate_cents: cleaner.hourlyRateCents,
    minimum_job_price_cents: cleaner.minimumJobPriceCents,
    service_radius_km: cleaner.serviceRadiusKm,
    years_of_experience: cleaner.yearsOfExperience,
    biography: `[DEMO] ${cleaner.biography}`,
    company_name: cleaner.yearsOfExperience > 10 ? `[DEMO] Servis ${cleaner.firstName}` : null,
    own_transportation: cleaner.ownTransportation,
    brings_supplies: cleaner.bringsSupplies,
    same_day_available: cleaner.sameDayAvailable,
    weekend_available: cleaner.weekendAvailable,
    vacation_mode: false,
    verified: false,
  }))
  const { error: cleanersError } = await client.from('cleaner_profiles').upsert(cleanerRows, { onConflict: 'user_id' })
  throwFor(cleanersError, 'Could not upsert demo cleaner profiles')

  const serviceAreas = cleaners.flatMap((cleaner) => [
    { cleaner_id: accountIds.get(cleaner.seedKey), city_code: cleaner.cityCode, radius_km: cleaner.serviceRadiusKm },
    ...(cleaner.secondaryCityCode === cleaner.cityCode
      ? []
      : [{
          cleaner_id: accountIds.get(cleaner.seedKey), city_code: cleaner.secondaryCityCode, radius_km: 15,
        }]),
  ])
  const languages = cleaners.flatMap((cleaner) => cleaner.languages.map((languageCode) => ({
    cleaner_id: accountIds.get(cleaner.seedKey), language_code: languageCode,
  })))
  const [{ error: areasError }, { error: languagesError }] = await Promise.all([
    client.from('cleaner_service_areas').upsert(serviceAreas, { onConflict: 'cleaner_id,city_code', ignoreDuplicates: true }),
    client.from('cleaner_languages').upsert(languages, { onConflict: 'cleaner_id,language_code', ignoreDuplicates: true }),
  ])
  throwFor(areasError ?? languagesError, 'Could not upsert demo cleaner capabilities')

  const availability = cleanerIds.flatMap((cleanerId, index) =>
    Array.from({ length: 7 }, (_, weekday) => ({
      cleaner_id: cleanerId,
      weekday,
      enabled: weekday !== 0 || index % 3 === 0,
    })))
  const { error: availabilityError } = await client.from('cleaner_availability').upsert(
    availability,
    { onConflict: 'cleaner_id,weekday' },
  )
  throwFor(availabilityError, 'Could not upsert demo cleaner availability')

  const jobs = buildJobs(ownerId, cleanerIds)
  const { error: jobsError } = await client.from('jobs').upsert(jobs, { onConflict: 'id' })
  throwFor(jobsError, 'Could not upsert demo jobs')

  const services = jobs.map((job, index) => ({
    job_id: job.id,
    cleaning_supplies_provided: index % 2 === 0,
    linen_replacement: index % 3 !== 0,
    towel_replacement: true,
    laundry: index % 4 === 0,
    balcony_cleaning: index % 3 === 0,
    fridge_cleaning: index % 5 === 0,
    oven_cleaning: index % 6 === 0,
    kitchen_cleaning: true,
    window_cleaning: index % 4 === 1,
    same_day_turnover: index === 5 || index === 10 || index === 14,
  }))
  const locationsRows = jobs.map((job, index) => ({
    job_id: job.id,
    exact_address: `[DEMO] Primjer lokacije ${index + 1}, ${locations[index % locations.length].label}`,
  }))
  const [{ error: servicesError }, { error: locationsError }] = await Promise.all([
    client.from('job_services').upsert(services, { onConflict: 'job_id' }),
    client.from('job_private_locations').upsert(locationsRows, { onConflict: 'job_id' }),
  ])
  throwFor(servicesError ?? locationsError, 'Could not upsert demo job details')

  const scores = [4.8, 4.6, 5, 4.4, 4.9]
  const reviews = jobs.slice(15).map((job, index) => ({
    id: toUuid(REVIEW_ID_PREFIX, index),
    job_id: job.id,
    reviewer_id: ownerId,
    reviewee_id: cleanerIds[index],
    overall_score: scores[index],
    comment: `[DEMO] Demonstracijska ocjena za prikaz profila. ${index % 2 === 0 ? 'Posao je obavljen uredno i prema dogovoru.' : 'Komunikacija je bila jasna, a apartman pripremljen na vrijeme.'}`,
    verified_completed_job: true,
    editable_until: addDays(new Date(), 365).toISOString(),
    is_demo: true,
  }))
  const { error: reviewsError } = await client.from('reviews').upsert(reviews, { onConflict: 'id' })
  throwFor(reviewsError, 'Could not upsert demo ratings')

  const [{ count: jobCount, error: jobCountError }, { count: cleanerCount, error: cleanerCountError }] = await Promise.all([
    client.from('jobs').select('id', { count: 'exact', head: true }).in('id', jobIds).eq('is_demo', true),
    client.from('profiles').select('id', { count: 'exact', head: true }).in('id', cleanerIds).eq('is_demo', true).eq('role', 'cleaner'),
  ])
  throwFor(jobCountError ?? cleanerCountError, 'Could not verify seeded demo records')
  if (jobCount !== 20 || cleanerCount !== 40) {
    throw new Error(`Seed verification failed: ${jobCount ?? 0} jobs and ${cleanerCount ?? 0} cleaners found`)
  }
  process.stdout.write(`Demo marketplace seed complete: ${jobCount} jobs and ${cleanerCount} cleaners.\n`)
}

validateSeed()
if (process.argv.includes('--validate')) {
  process.stdout.write(`Demo marketplace seed valid: ${jobTemplates.length} jobs and ${cleaners.length} cleaners.\n`)
}
else {
  await seed()
}
