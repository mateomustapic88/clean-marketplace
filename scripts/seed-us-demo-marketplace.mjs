import { randomBytes } from 'node:crypto'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const DEMO_SEED_KEY = 'clean-marketplace-us-public-demo-v1'
const DEMO_OWNER_EMAIL = 'demo-us-owner@seed.clean-marketplace.com'
const JOB_ID_PREFIX = 'e3000000-0000-4000-8000-0000000000'

const locations = [
  { cityCode: 'us-fl-miami', area: 'South Beach', label: 'Miami, FL' },
  { cityCode: 'us-fl-orlando', area: 'Lake Buena Vista', label: 'Orlando, FL' },
  { cityCode: 'us-ca-los-angeles', area: 'Santa Monica', label: 'Los Angeles, CA' },
  { cityCode: 'us-ca-san-diego', area: 'Mission Beach', label: 'San Diego, CA' },
  { cityCode: 'us-tx-austin', area: 'Downtown', label: 'Austin, TX' },
  { cityCode: 'us-ny-new-york', area: 'Brooklyn', label: 'New York, NY' },
  { cityCode: 'us-il-chicago', area: 'River North', label: 'Chicago, IL' },
  { cityCode: 'us-az-phoenix', area: 'Scottsdale', label: 'Phoenix, AZ' },
  { cityCode: 'us-nv-las-vegas', area: 'Summerlin', label: 'Las Vegas, NV' },
  { cityCode: 'us-wa-seattle', area: 'Capitol Hill', label: 'Seattle, WA' },
  { cityCode: 'us-tn-nashville', area: 'The Gulch', label: 'Nashville, TN' },
  { cityCode: 'us-hi-honolulu', area: 'Waikiki', label: 'Honolulu, HI' },
]

const cleanerTemplates = [
  ['Maya', 'Johnson', 6, 32, 85],
  ['Olivia', 'Martinez', 4, 29, 75],
  ['Sophia', 'Williams', 9, 38, 95],
  ['Isabella', 'Garcia', 5, 34, 80],
  ['Emma', 'Brown', 3, 27, 70],
  ['Ava', 'Davis', 8, 41, 110],
  ['Mia', 'Wilson', 7, 36, 90],
  ['Camila', 'Anderson', 10, 44, 120],
  ['Luna', 'Thomas', 2, 26, 65],
  ['Amelia', 'Taylor', 12, 46, 125],
  ['Harper', 'Moore', 5, 33, 85],
  ['Evelyn', 'Jackson', 6, 35, 90],
  ['Sofia', 'Harris', 4, 31, 75],
  ['Chloe', 'Clark', 7, 39, 100],
  ['Layla', 'Lewis', 3, 28, 70],
  ['Nora', 'Walker', 11, 45, 120],
]

const biographies = [
  'Reliable short-term rental cleaner focused on guest-ready details, kitchens, bathrooms, and final walkthroughs.',
  'Experienced with vacation rentals, apartments, and family homes. Clear communication and dependable scheduling.',
  'Detail-oriented cleaner available for recurring service and same-day turnovers. Supplies can be provided when requested.',
  'Specialized in check-out cleaning, linen changes, and preparing properties for the next guest arrival.',
  'Professional residential cleaning with careful attention to high-touch surfaces, floors, and presentation.',
  'Experienced in hospitality and private homes, with flexible weekday and weekend availability.',
]

const jobTemplates = [
  ['Vacation rental turnover', 'South Beach Condo', 'Full check-out cleaning, fresh linens, two bathrooms, and a final guest-ready walkthrough.'],
  ['Weekly condo cleaning', 'Lakeview Condo', 'Recurring weekly cleaning for a two-bedroom condo, including floors, kitchen, and bathrooms.'],
  ['Same-day guest turnover', 'Santa Monica Guesthouse', 'Guests leave in the morning and the next check-in is at 4 PM. Linens are available on site.'],
  ['Beach house cleaning', 'Mission Beach House', 'Post-stay cleaning for a three-bedroom beach house, including patio doors and kitchen.'],
  ['Downtown apartment refresh', 'Austin City Loft', 'Standard apartment cleaning before a new tenant arrives, with extra attention to the kitchen.'],
  ['Short-term rental turnover', 'Brooklyn Brownstone', 'Prepare the rental after check-out, change bedding, restock towels, and clean two bathrooms.'],
  ['Corporate apartment cleaning', 'River North Suite', 'Biweekly cleaning of a furnished one-bedroom apartment used for corporate stays.'],
  ['Move-out deep clean', 'Scottsdale Townhome', 'Detailed move-out clean including inside cabinets, appliances, baseboards, and windows.'],
  ['Vacation home preparation', 'Summerlin Retreat', 'Prepare a four-bedroom vacation home for arriving guests, including linen and towel changes.'],
  ['Recurring home cleaning', 'Capitol Hill Home', 'Looking for reliable service every other week for a two-bedroom home with one small dog.'],
  ['Rental turnover before check-in', 'The Gulch Apartment', 'Complete a fast turnover between reservations and confirm the property is ready by 3 PM.'],
  ['Waikiki condo cleaning', 'Ocean View Condo', 'Guest turnover with balcony cleaning, fresh linens, and detailed bathroom preparation.'],
]

const toUuid = (prefix, index) => `${prefix}${String(index + 1).padStart(2, '0')}`
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000)
const dateOnly = (date) => date.toISOString().slice(0, 10)
const isoAt = (date, hours) => {
  const value = new Date(date)
  value.setUTCHours(hours, 0, 0, 0)
  return value.toISOString()
}

const cleaners = cleanerTemplates.map(([firstName, lastName, experience, hourlyRate, minimumPrice], index) => {
  const primary = locations[index % locations.length]
  const secondary = locations[(index + 4) % locations.length]
  return {
    seedKey: `us-cleaner-${String(index + 1).padStart(2, '0')}`,
    email: `demo-us-cleaner-${String(index + 1).padStart(2, '0')}@seed.clean-marketplace.com`,
    firstName,
    lastName,
    cityCode: primary.cityCode,
    secondaryCityCode: secondary.cityCode,
    yearsOfExperience: experience,
    hourlyRateCents: hourlyRate * 100,
    minimumJobPriceCents: minimumPrice * 100,
    serviceRadiusKm: 20 + (index % 4) * 10,
    languages: index % 4 === 0 ? ['en', 'es'] : ['en'],
    biography: biographies[index % biographies.length],
    ownTransportation: index % 5 !== 0,
    bringsSupplies: index % 3 !== 0,
    sameDayAvailable: index % 4 === 0,
    weekendAvailable: index % 2 === 0,
  }
})

const buildJobs = (ownerId, now = new Date()) => jobTemplates.map((template, index) => {
  const [title, propertyName, description] = template
  const preferredDate = addDays(now, 5 + index * 2)
  const location = locations[index]
  return {
    id: toUuid(JOB_ID_PREFIX, index),
    owner_id: ownerId,
    assigned_cleaner_id: null,
    accepted_offer_id: null,
    title: `[DEMO] ${title}`,
    apartment_name: `[DEMO] ${propertyName}`,
    city_code: location.cityCode,
    country_code: 'US',
    currency_code: 'USD',
    approximate_area: location.area,
    hide_exact_address: true,
    size_square_meters: 55 + (index % 6) * 22,
    bedrooms: 1 + (index % 4),
    bathrooms: 1 + (index % 3),
    beds: 1 + (index % 5),
    guest_capacity: 2 + (index % 7),
    estimated_duration_hours: 2 + (index % 5) * 0.5,
    preferred_date: dateOnly(preferredDate),
    preferred_start_time: `${String(8 + (index % 6)).padStart(2, '0')}:00`,
    flexible_time: index % 3 === 0,
    proposed_budget_cents: 8500 + (index % 8) * 1500,
    budget_type: index % 4 === 0 ? 'hourly' : 'fixed',
    additional_instructions: `[DEMO] ${description}`,
    offer_deadline: isoAt(addDays(preferredDate, -2), 18),
    status: index % 3 === 0 ? 'receiving_offers' : 'published',
    is_urgent: index === 2 || index === 10,
    is_demo: true,
  }
})

const validateSeed = () => {
  const errors = []
  if (cleaners.length !== 16) errors.push(`Expected 16 cleaners, received ${cleaners.length}`)
  if (jobTemplates.length !== 12) errors.push(`Expected 12 jobs, received ${jobTemplates.length}`)
  if (new Set(cleaners.map(({ email }) => email)).size !== cleaners.length) errors.push('Cleaner emails must be unique')
  if (locations.some(({ cityCode }) => !cityCode.startsWith('us-'))) errors.push('Every location must be a US city')
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

  const { data, error } = await authAdmin.createUser({
    email: account.email,
    password: randomBytes(32).toString('base64url'),
    email_confirm: true,
    user_metadata: {
      demo_seed: DEMO_SEED_KEY,
      demo_seed_key: account.seedKey,
      role: account.role,
      first_name: `[DEMO] ${account.firstName}`,
      last_name: account.lastName,
      city_code: account.cityCode,
      country_code: 'US',
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

  const client = createClient(new URL(configuredSupabaseUrl).origin, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const existingUsers = await listAuthUsers(client.auth.admin)
  const existingByEmail = new Map(existingUsers.map((user) => [String(user.email).toLowerCase(), user]))
  const jobIds = jobTemplates.map((_, index) => toUuid(JOB_ID_PREFIX, index))
  const { data: existingJobs, error: existingJobsError } = await client
    .from('jobs').select('id, is_demo').in('id', jobIds)
  throwFor(existingJobsError, 'Could not inspect existing jobs')
  if (existingJobs?.some((job) => !job.is_demo)) {
    throw new Error('Refusing to overwrite a non-demo job with a reserved seed identifier')
  }

  const accounts = [{
    seedKey: 'us-owner', email: DEMO_OWNER_EMAIL, firstName: 'US Marketplace', lastName: 'Demo Owner',
    cityCode: 'us-fl-miami', role: 'owner',
  }, ...cleaners.map((cleaner) => ({ ...cleaner, role: 'cleaner' }))]
  const accountIds = new Map()
  for (const account of accounts) {
    accountIds.set(
      account.seedKey,
      await ensureDemoAuthUser(client.auth.admin, existingByEmail, account),
    )
  }

  const ownerId = accountIds.get('us-owner')
  const cleanerIds = cleaners.map((cleaner) => accountIds.get(cleaner.seedKey))
  if (!ownerId || cleanerIds.some((id) => !id)) throw new Error('Demo account identifiers could not be resolved')

  const profileRows = accounts.map((account) => ({
    id: accountIds.get(account.seedKey),
    role: account.role,
    status: 'active',
    first_name: `[DEMO] ${account.firstName}`,
    last_name: account.lastName,
    city_code: account.cityCode,
    country_code: 'US',
    currency_code: 'USD',
    bio: account.role === 'cleaner'
      ? `[DEMO] ${account.biography}`
      : '[DEMO] Owner profile for illustrative United States listings.',
    onboarding_completed: true,
    is_demo: true,
  }))
  const { error: profilesError } = await client.from('profiles').upsert(profileRows, { onConflict: 'id' })
  throwFor(profilesError, 'Could not upsert demo profiles')

  const { error: ownerError } = await client.from('owner_profiles').upsert({
    user_id: ownerId,
    company_name: '[DEMO] Clean Marketplace US',
    agency_name: null,
    apartment_name: '[DEMO] Illustrative US properties',
    apartment_city_code: 'us-fl-miami',
  }, { onConflict: 'user_id' })
  throwFor(ownerError, 'Could not upsert demo owner profile')

  const cleanerRows = cleaners.map((cleaner) => ({
    user_id: accountIds.get(cleaner.seedKey),
    hourly_rate_cents: cleaner.hourlyRateCents,
    minimum_job_price_cents: cleaner.minimumJobPriceCents,
    service_radius_km: cleaner.serviceRadiusKm,
    years_of_experience: cleaner.yearsOfExperience,
    biography: `[DEMO] ${cleaner.biography}`,
    company_name: null,
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
          cleaner_id: accountIds.get(cleaner.seedKey), city_code: cleaner.secondaryCityCode, radius_km: 20,
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

  const jobs = buildJobs(ownerId)
  const { error: jobsError } = await client.from('jobs').upsert(jobs, { onConflict: 'id' })
  throwFor(jobsError, 'Could not upsert demo jobs')

  const services = jobs.map((job, index) => ({
    job_id: job.id,
    cleaning_supplies_provided: index % 2 === 0,
    linen_replacement: index % 3 !== 0,
    towel_replacement: true,
    laundry: index % 4 === 0,
    balcony_cleaning: index === 0 || index === 3 || index === 11,
    fridge_cleaning: index % 5 === 0,
    oven_cleaning: index % 6 === 0,
    kitchen_cleaning: true,
    window_cleaning: index % 4 === 1,
    same_day_turnover: index === 2 || index === 10,
  }))
  const privateLocations = jobs.map((job, index) => ({
    job_id: job.id,
    exact_address: `[DEMO] Illustrative address ${index + 1}, ${locations[index].label}`,
  }))
  const [{ error: servicesError }, { error: locationsError }] = await Promise.all([
    client.from('job_services').upsert(services, { onConflict: 'job_id' }),
    client.from('job_private_locations').upsert(privateLocations, { onConflict: 'job_id' }),
  ])
  throwFor(servicesError ?? locationsError, 'Could not upsert demo job details')

  const [{ count: jobCount, error: jobCountError }, { count: cleanerCount, error: cleanerCountError }]
    = await Promise.all([
      client.from('jobs').select('id', { count: 'exact', head: true }).in('id', jobIds).eq('is_demo', true).eq('country_code', 'US'),
      client.from('profiles').select('id', { count: 'exact', head: true }).in('id', cleanerIds).eq('is_demo', true).eq('role', 'cleaner').eq('country_code', 'US'),
    ])
  throwFor(jobCountError ?? cleanerCountError, 'Could not verify seeded demo records')
  if (jobCount !== jobTemplates.length || cleanerCount !== cleaners.length) {
    throw new Error(`Seed verification failed: ${jobCount ?? 0} jobs and ${cleanerCount ?? 0} cleaners found`)
  }
  process.stdout.write(`US demo marketplace seed complete: ${jobCount} jobs and ${cleanerCount} cleaners.\n`)
}

validateSeed()
if (process.argv.includes('--validate')) {
  process.stdout.write(`US demo marketplace seed valid: ${jobTemplates.length} jobs and ${cleaners.length} cleaners.\n`)
}
else {
  await seed()
}
