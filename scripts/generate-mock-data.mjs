import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outputDirectory = resolve('data/mock')
mkdirSync(outputDirectory, { recursive: true })

const writeJson = (name, value) => {
  writeFileSync(
    resolve(outputDirectory, `${name}.json`),
    `${JSON.stringify(value, null, 2)}\n`,
  )
}

const createdAt = '2026-06-01T08:00:00.000Z'
const updatedAt = '2026-07-20T10:00:00.000Z'

const entity = (id) => ({
  id,
  isDemo: true,
  createdAt,
  updatedAt,
})

const cities = [
  ['zagreb', 'Zagreb', 'Grad Zagreb'],
  ['split', 'Split', 'Splitsko-dalmatinska'],
  ['zadar', 'Zadar', 'Zadarska'],
  ['dubrovnik', 'Dubrovnik', 'Dubrovačko-neretvanska'],
  ['rijeka', 'Rijeka', 'Primorsko-goranska'],
  ['pula', 'Pula', 'Istarska'],
  ['sibenik', 'Šibenik', 'Šibensko-kninska'],
  ['makarska', 'Makarska', 'Splitsko-dalmatinska'],
  ['rovinj', 'Rovinj', 'Istarska'],
  ['trogir', 'Trogir', 'Splitsko-dalmatinska'],
].map(([code, name, county], index) => ({
  ...entity(`city-${String(index + 1).padStart(2, '0')}`),
  code,
  name,
  county,
}))

const ownerNames = [
  ['Ana', 'Kovač'],
  ['Marko', 'Babić'],
  ['Ivana', 'Radić'],
  ['Luka', 'Horvat'],
  ['Petra', 'Jurić'],
  ['Nikola', 'Marić'],
  ['Maja', 'Perić'],
  ['Ivan', 'Božić'],
  ['Lucija', 'Pavić'],
  ['Tomislav', 'Matić'],
  ['Marina', 'Grgić'],
  ['Dario', 'Vuković'],
  ['Katarina', 'Šarić'],
  ['Josip', 'Rajić'],
  ['Tea', 'Novak'],
]

const cleanerNames = [
  ['Marija', 'Knežević'],
  ['Ivana', 'Barišić'],
  ['Sandra', 'Milić'],
  ['Jelena', 'Tomić'],
  ['Martina', 'Lončar'],
  ['Kristina', 'Kralj'],
  ['Andrea', 'Ilić'],
  ['Nina', 'Petrović'],
  ['Antonija', 'Župan'],
  ['Renata', 'Katić'],
  ['Dora', 'Blažević'],
  ['Mirjana', 'Klarić'],
  ['Tanja', 'Rukavina'],
  ['Vesna', 'Đurić'],
  ['Valentina', 'Brkić'],
  ['Irena', 'Mandić'],
  ['Gabrijela', 'Soldo'],
  ['Lorena', 'Pranjić'],
  ['Ema', 'Vidak'],
  ['Helena', 'Lukić'],
  ['Sara', 'Krpan'],
  ['Ines', 'Jakovljević'],
  ['Paula', 'Mikulić'],
  ['Monika', 'Erceg'],
  ['Tamara', 'Varga'],
  ['Danijela', 'Bašić'],
  ['Karla', 'Vukelić'],
  ['Lea', 'Magaš'],
  ['Barbara', 'Pavlović'],
  ['Mateja', 'Cindrić'],
  ['Anita', 'Kovačević'],
  ['Mirela', 'Bilić'],
  ['Zrinka', 'Lovrić'],
  ['Silvija', 'Šimić'],
  ['Tea', 'Ćosić'],
  ['Ksenija', 'Kordić'],
  ['Natali', 'Maretić'],
]

const users = []
const credentials = []

const addAccount = (id, firstName, lastName, role, index) => {
  const email = role === 'admin'
    ? 'admin@demo.clean.hr'
    : `${role}${String(index + 1).padStart(2, '0')}@demo.clean.hr`
  users.push({
    ...entity(id),
    email,
    displayName: `${firstName} ${lastName}`,
    role,
    status: 'active',
    avatarSeed: `${firstName}-${lastName}-${index}`,
  })
  credentials.push({
    ...entity(`credential-${id}`),
    userId: id,
    email,
    password: 'Demo1234',
  })
}

ownerNames.forEach(([firstName, lastName], index) => {
  addAccount(`owner-user-${String(index + 1).padStart(2, '0')}`, firstName, lastName, 'owner', index)
})

cleanerNames.forEach(([firstName, lastName], index) => {
  addAccount(`cleaner-user-${String(index + 1).padStart(2, '0')}`, firstName, lastName, 'cleaner', index)
})

addAccount('admin-user-01', 'Marta', 'Administrator', 'admin', 0)

const owners = ownerNames.map(([firstName, lastName], index) => ({
  ...entity(`owner-${String(index + 1).padStart(2, '0')}`),
  userId: `owner-user-${String(index + 1).padStart(2, '0')}`,
  firstName,
  lastName,
  phone: `+385 91 500 ${String(100 + index).padStart(3, '0')}`,
  cityCode: cities[index % cities.length].code,
  preferredContactMethod: ['email', 'phone', 'sms'][index % 3],
  companyName: index % 4 === 0 ? `Adria Apartmani ${index + 1}` : null,
  agencyName: index % 5 === 0 ? `Demo turistička agencija ${index + 1}` : null,
  notificationPreferences: {
    email: true,
    inApp: true,
    jobUpdates: true,
    offers: true,
    marketing: false,
  },
  averageRating: index % 3 === 0 ? null : Number((4.2 + (index % 7) * 0.1).toFixed(1)),
  ratingCount: index % 3 === 0 ? 0 : 2 + (index % 9),
}))

const availability = (index) => Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  enabled: weekday !== 0 || index % 3 === 0,
  ranges: weekday !== 0 || index % 3 === 0
    ? [{ start: index % 2 === 0 ? '08:00' : '09:00', end: index % 2 === 0 ? '16:00' : '17:00' }]
    : [],
}))

const biographies = [
  'Pouzdano i temeljito održavam apartmane između smjena gostiju. Demo profil za prikaz funkcionalnosti platforme.',
  'Imam iskustvo u čišćenju turističkog smještaja i organizaciji brzih promjena gostiju. Svi podaci su demonstracijski.',
  'Fokus mi je uredan, detaljan i pravovremen rad uz jasan dogovor s vlasnikom. Ovo je isključivo demo profil.',
  'Dostupna sam za redovita i povremena čišćenja apartmana. Profil i iskustvo služe samo kao primjer.',
]

const cleaners = cleanerNames.map(([firstName, lastName], index) => {
  const city = cities[index % cities.length]
  const secondCity = cities[(index + 1) % cities.length]
  return {
    ...entity(`cleaner-${String(index + 1).padStart(2, '0')}`),
    userId: `cleaner-user-${String(index + 1).padStart(2, '0')}`,
    firstName,
    lastName,
    phone: `+385 98 600 ${String(100 + index).padStart(3, '0')}`,
    cityCode: city.code,
    hourlyRate: 14 + (index % 9),
    minimumJobPrice: 35 + (index % 6) * 5,
    serviceRadiusKm: 15 + (index % 5) * 5,
    serviceAreas: [
      { cityCode: city.code, radiusKm: 20 + (index % 4) * 5 },
      { cityCode: secondCity.code, radiusKm: 15 },
    ],
    availability: availability(index),
    yearsOfExperience: 1 + (index % 12),
    biography: biographies[index % biographies.length],
    companyName: index % 6 === 0 ? `Demo servis Sjaj ${index + 1}` : null,
    oib: null,
    website: null,
    languages: index % 4 === 0 ? ['hr', 'en', 'de'] : ['hr', 'en'],
    ownTransportation: index % 5 !== 0,
    bringsSupplies: index % 3 !== 0,
    sameDayAvailable: index % 4 === 0,
    weekendAvailable: index % 2 === 0,
    averageRating: index % 7 === 0 ? null : Number((4.1 + (index % 9) * 0.1).toFixed(1)),
    ratingCount: index % 7 === 0 ? 0 : 3 + (index % 17),
    completedJobs: index % 7 === 0 ? 0 : 4 + (index % 28),
  }
})

const adminProfiles = [{
  ...entity('admin-01'),
  userId: 'admin-user-01',
  firstName: 'Marta',
  lastName: 'Administrator',
}]

const jobStatuses = [
  'published',
  'receiving_offers',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]

const jobTitles = [
  'Čišćenje apartmana nakon odlaska gostiju',
  'Priprema apartmana za novu rezervaciju',
  'Redovito čišćenje studio apartmana',
  'Detaljno čišćenje obiteljskog apartmana',
  'Brza smjena gostiju i zamjena posteljine',
]

const jobs = Array.from({ length: 40 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')
  const status = index === 3 ? 'published' : jobStatuses[index % jobStatuses.length]
  const accepted = ['assigned', 'in_progress', 'completed'].includes(status)
  const scheduledCity = cities[index % cities.length]
  const isDubrovnikSlot = scheduledCity.code === 'dubrovnik'
  const city = isDubrovnikSlot && index !== 3
    ? cities.find(({ code }) => code === 'split')
    : scheduledCity
  if (!city) throw new Error('Mock job city could not be resolved')
  const approximateArea = isDubrovnikSlot
    ? index === 3
      ? 'Stari grad'
      : 'Žnjan'
    : `${city.name} - šire središte`
  const acceptedOfferId = accepted ? `offer-${number}-01` : null
  const assignedCleanerId = accepted
    ? `cleaner-user-${String((index % cleanerNames.length) + 1).padStart(2, '0')}`
    : null
  return {
    ...entity(`job-${number}`),
    ownerId: `owner-user-${String((index % ownerNames.length) + 1).padStart(2, '0')}`,
    assignedCleanerId,
    acceptedOfferId,
    title: jobTitles[index % jobTitles.length],
    apartmentName: `Demo apartman ${city.name} ${index + 1}`,
    cityCode: city.code,
    approximateArea,
    address: `Primjer ulice ${index + 1}`,
    hideExactAddress: true,
    sizeSquareMeters: 35 + (index % 8) * 10,
    bedrooms: 1 + (index % 4),
    bathrooms: 1 + (index % 2),
    beds: 2 + (index % 6),
    estimatedDurationHours: 2 + (index % 5) * 0.5,
    preferredDate: `2026-${String(8 + Math.floor(index / 28)).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    preferredStartTime: `${String(8 + (index % 7)).padStart(2, '0')}:00`,
    flexibleTime: index % 3 === 0,
    proposedBudget: 55 + (index % 10) * 10,
    budgetType: index % 4 === 0 ? 'hourly' : 'fixed',
    services: {
      cleaningSuppliesProvided: index % 2 === 0,
      linenReplacement: index % 3 !== 0,
      towelReplacement: index % 3 !== 0,
      laundry: index % 5 === 0,
      balconyCleaning: index % 4 === 0,
      fridgeCleaning: index % 6 === 0,
      ovenCleaning: index % 7 === 0,
      sameDayTurnover: index % 3 === 0,
    },
    additionalInstructions: 'Primjer oglasa. Molimo potvrditi vrijeme dolaska prije prihvaćanja ponude.',
    photoUrls: [],
    offerDeadline: `2026-07-${String((index % 28) + 1).padStart(2, '0')}T18:00:00.000Z`,
    status,
    offerCount: 3,
    isUrgent: index % 8 === 0,
  }
})

const offerMessages = [
  'Demo ponuda. Dostupna sam u navedenom terminu i mogu donijeti sredstva za čišćenje.',
  'Primjer ponude. Imam iskustvo sa smjenama gostiju i mogu potvrditi dolazak unaprijed.',
  'Demo sadržaj. Predložena cijena uključuje dogovorene zadatke i zamjenu posteljine.',
]

const offers = jobs.flatMap((job, jobIndex) => Array.from({ length: 3 }, (_, offerIndex) => {
  const jobNumber = String(jobIndex + 1).padStart(2, '0')
  const offerNumber = String(offerIndex + 1).padStart(2, '0')
  const cleanerIndex = (jobIndex + offerIndex) % cleanerNames.length
  let status = 'pending'
  if (job.acceptedOfferId) {
    status = offerIndex === 0 ? 'accepted' : 'rejected'
  }
  else if (job.status === 'cancelled') {
    status = offerIndex === 0 ? 'withdrawn' : 'expired'
  }
  return {
    ...entity(`offer-${jobNumber}-${offerNumber}`),
    jobId: job.id,
    cleanerId: `cleaner-user-${String(cleanerIndex + 1).padStart(2, '0')}`,
    proposedPrice: job.proposedBudget + (offerIndex - 1) * 5,
    priceType: job.budgetType,
    estimatedDurationHours: job.estimatedDurationHours,
    availableArrivalTime: `${String(8 + offerIndex).padStart(2, '0')}:00`,
    message: offerMessages[offerIndex],
    suppliesIncluded: offerIndex !== 1,
    expiresAt: job.offerDeadline,
    status,
  }
}))

const completedJobs = jobs.filter((job) => job.status === 'completed')
const ratings = completedJobs.flatMap((job, index) => {
  const cleanerId = job.assignedCleanerId
  return [
    {
      ...entity(`rating-${String(index + 1).padStart(2, '0')}-owner`),
      jobId: job.id,
      authorId: job.ownerId,
      subjectId: cleanerId,
      categoryScores: [
        { category: 'cleaning_quality', score: 4 + (index % 2) },
        { category: 'reliability', score: 5 },
        { category: 'communication', score: 4 + (index % 2) },
        { category: 'punctuality', score: 5 },
      ],
      overallScore: 4 + (index % 2),
      comment: 'Demo recenzija za prikaz završenog poslovnog tijeka.',
    },
    {
      ...entity(`rating-${String(index + 1).padStart(2, '0')}-cleaner`),
      jobId: job.id,
      authorId: cleanerId,
      subjectId: job.ownerId,
      categoryScores: [
        { category: 'description_accuracy', score: 5 },
        { category: 'communication', score: 4 + (index % 2) },
        { category: 'organization', score: 4 + (index % 2) },
        { category: 'fairness', score: 5 },
      ],
      overallScore: 4 + (index % 2),
      comment: 'Demo recenzija vlasnika. Sadržaj nije iskustvo stvarne osobe.',
    },
  ]
})

const subscriptionStatuses = ['trial', 'active', 'active', 'active', 'past_due', 'cancelled', 'expired']
const subscriptions = cleanerNames.map((_, index) => {
  const status = subscriptionStatuses[index % subscriptionStatuses.length]
  return {
    ...entity(`subscription-${String(index + 1).padStart(2, '0')}`),
    cleanerId: `cleaner-user-${String(index + 1).padStart(2, '0')}`,
    status,
    priceMonthly: 39,
    currency: 'EUR',
    trialStartedAt: status === 'trial' ? '2026-07-20T00:00:00.000Z' : null,
    trialEndsAt: status === 'trial' ? '2026-07-27T00:00:00.000Z' : null,
    currentPeriodStartedAt: status === 'active' ? '2026-07-01T00:00:00.000Z' : null,
    currentPeriodEndsAt: status === 'active' ? '2026-08-01T00:00:00.000Z' : null,
    cancelledAt: status === 'cancelled' ? '2026-07-15T00:00:00.000Z' : null,
  }
})

const notifications = Array.from({ length: 45 }, (_, index) => {
  const isOwner = index % 2 === 0
  const userIndex = isOwner
    ? index % ownerNames.length
    : index % cleanerNames.length
  return {
    ...entity(`notification-${String(index + 1).padStart(3, '0')}`),
    userId: `${isOwner ? 'owner' : 'cleaner'}-user-${String(userIndex + 1).padStart(2, '0')}`,
    type: isOwner ? 'new_offer' : 'job_updated',
    titleKey: isOwner ? 'notifications.types.newOffer.title' : 'notifications.types.jobUpdated.title',
    messageKey: isOwner ? 'notifications.types.newOffer.message' : 'notifications.types.jobUpdated.message',
    resourceId: `job-${String((index % jobs.length) + 1).padStart(2, '0')}`,
    readAt: index % 3 === 0 ? '2026-07-21T10:00:00.000Z' : null,
  }
})

writeJson('cities', cities)
writeJson('users', users)
writeJson('credentials', credentials)
writeJson('owners', owners)
writeJson('cleaners', cleaners)
writeJson('admins', adminProfiles)
writeJson('jobs', jobs)
writeJson('offers', offers)
writeJson('ratings', ratings)
writeJson('subscriptions', subscriptions)
writeJson('notifications', notifications)

console.log(JSON.stringify({
  users: users.length,
  owners: owners.length,
  cleaners: cleaners.length,
  jobs: jobs.length,
  offers: offers.length,
  ratings: ratings.length,
  subscriptions: subscriptions.length,
  notifications: notifications.length,
}, null, 2))
