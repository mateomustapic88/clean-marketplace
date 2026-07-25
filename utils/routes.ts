import type { UserRole } from '~/domains/users/types'

export type SupportedLocale = 'hr' | 'en' | 'sl'

const routePaths = {
  home: {
    hr: '/',
    en: '/en',
    sl: '/sl',
  },
  login: {
    hr: '/prijava',
    en: '/en/login',
    sl: '/sl/prijava',
  },
  register: {
    hr: '/registracija',
    en: '/en/register',
    sl: '/sl/registracija',
  },
  forgotPassword: {
    hr: '/zaboravljena-lozinka',
    en: '/en/forgot-password',
    sl: '/sl/pozabljeno-geslo',
  },
  resetPassword: {
    hr: '/nova-lozinka',
    en: '/en/reset-password',
    sl: '/sl/novo-geslo',
  },
  jobs: {
    hr: '/poslovi',
    en: '/en/jobs',
    sl: '/sl/dela',
  },
  cleaners: {
    hr: '/cistaci',
    en: '/en/cleaners',
    sl: '/sl/cistilci',
  },
  apartmentCleaning: {
    hr: '/ciscenje-apartmana',
    en: '/en/apartment-cleaning-croatia',
    sl: '/sl/ciscenje-apartmajev-hrvaska',
  },
  howItWorks: {
    hr: '/kako-funkcionira',
    en: '/en/how-it-works',
    sl: '/sl/kako-deluje',
  },
  pricing: {
    hr: '/cijene',
    en: '/en/pricing',
    sl: '/sl/cene',
  },
  contact: {
    hr: '/kontakt',
    en: '/en/contact',
    sl: '/sl/kontakt',
  },
  privacy: {
    hr: '/politika-privatnosti',
    en: '/en/privacy',
    sl: '/sl/politika-zasebnosti',
  },
  terms: {
    hr: '/uvjeti-koristenja',
    en: '/en/terms',
    sl: '/sl/pogoji-uporabe',
  },
  cookies: {
    hr: '/politika-kolacica',
    en: '/en/cookie-policy',
    sl: '/sl/politika-piskotkov',
  },
  forbidden: {
    hr: '/zabranjeno',
    en: '/en/forbidden',
    sl: '/sl/prepovedano',
  },
  ownerDashboard: {
    hr: '/dashboard',
    en: '/en/dashboard',
    sl: '/sl/nadzorna-plosca',
  },
  ownerJobs: {
    hr: '/dashboard/poslovi',
    en: '/en/dashboard/jobs',
    sl: '/sl/nadzorna-plosca/dela',
  },
  ownerNewJob: {
    hr: '/dashboard/poslovi/novi',
    en: '/en/dashboard/jobs/new',
    sl: '/sl/nadzorna-plosca/dela/novo',
  },
  ownerProfile: {
    hr: '/dashboard/profil',
    en: '/en/dashboard/profile',
    sl: '/sl/nadzorna-plosca/profil',
  },
  ownerSettings: {
    hr: '/dashboard/postavke',
    en: '/en/dashboard/settings',
    sl: '/sl/nadzorna-plosca/nastavitve',
  },
  ownerBilling: {
    hr: '/dashboard/billing',
    en: '/en/dashboard/billing',
    sl: '/sl/nadzorna-plosca/obracun',
  },
  ownerNotifications: {
    hr: '/dashboard/obavijesti',
    en: '/en/dashboard/notifications',
    sl: '/sl/nadzorna-plosca/obvestila',
  },
  cleanerDashboard: {
    hr: '/dashboard-cleaner',
    en: '/en/dashboard-cleaner',
    sl: '/sl/nadzorna-plosca-cistilec',
  },
  cleanerJobs: {
    hr: '/dashboard-cleaner/poslovi',
    en: '/en/dashboard-cleaner/jobs',
    sl: '/sl/nadzorna-plosca-cistilec/dela',
  },
  cleanerFavourites: {
    hr: '/dashboard-cleaner/favoriti',
    en: '/en/dashboard-cleaner/favourites',
    sl: '/sl/nadzorna-plosca-cistilec/priljubljeni',
  },
  cleanerOffers: {
    hr: '/dashboard-cleaner/ponude',
    en: '/en/dashboard-cleaner/offers',
    sl: '/sl/nadzorna-plosca-cistilec/ponudbe',
  },
  cleanerAcceptedJobs: {
    hr: '/dashboard-cleaner/prihvaceni-poslovi',
    en: '/en/dashboard-cleaner/accepted-jobs',
    sl: '/sl/nadzorna-plosca-cistilec/sprejeta-dela',
  },
  cleanerProfile: {
    hr: '/dashboard-cleaner/profil',
    en: '/en/dashboard-cleaner/profile',
    sl: '/sl/nadzorna-plosca-cistilec/profil',
  },
  cleanerAvailability: {
    hr: '/dashboard-cleaner/dostupnost',
    en: '/en/dashboard-cleaner/availability',
    sl: '/sl/nadzorna-plosca-cistilec/razpolozljivost',
  },
  cleanerBilling: {
    hr: '/dashboard-cleaner/billing',
    en: '/en/dashboard-cleaner/billing',
    sl: '/sl/nadzorna-plosca-cistilec/obracun',
  },
  cleanerNotifications: {
    hr: '/dashboard-cleaner/obavijesti',
    en: '/en/dashboard-cleaner/notifications',
    sl: '/sl/nadzorna-plosca-cistilec/obvestila',
  },
  adminDashboard: {
    hr: '/admin',
    en: '/en/admin',
    sl: '/sl/admin',
  },
  ownerOnboarding: {
    hr: '/onboarding/vlasnik',
    en: '/en/onboarding/owner',
    sl: '/sl/uvajanje/lastnik',
  },
  cleanerOnboarding: {
    hr: '/onboarding/cistac',
    en: '/en/onboarding/cleaner',
    sl: '/sl/uvajanje/cistilec',
  },
} as const

export type AppRouteKey = keyof typeof routePaths

export const getAppRoute = (
  route: AppRouteKey,
  locale: string,
): string => routePaths[route][locale === 'en' ? 'en' : locale === 'sl' ? 'sl' : 'hr']

export const getLocaleFromPath = (path: string): 'hr' | 'en' | 'sl' =>
  path === '/en' || path.startsWith('/en/')
    ? 'en'
    : path === '/sl' || path.startsWith('/sl/')
      ? 'sl'
      : 'hr'

export const getRegistrationRoute = (
  role: Exclude<UserRole, 'admin'>,
  locale: string,
): string => `${getAppRoute('register', locale)}?role=${role}`

export const getRoleDashboardRoute = (
  role: UserRole,
  locale: string,
): string => {
  const routeByRole: Record<UserRole, AppRouteKey> = {
    owner: 'ownerDashboard',
    cleaner: 'cleanerDashboard',
    admin: 'adminDashboard',
  }
  return getAppRoute(routeByRole[role], locale)
}

export const getRoleOnboardingRoute = (
  role: Exclude<UserRole, 'admin'>,
  locale: string,
): string => getAppRoute(
  role === 'owner' ? 'ownerOnboarding' : 'cleanerOnboarding',
  locale,
)

export const getJobRoute = (id: string, locale: string): string =>
  `${getAppRoute('jobs', locale)}/${id}`

export const getCleanerRoute = (id: string, locale: string): string =>
  `${getAppRoute('cleaners', locale)}/${id}`

export const getOwnerJobRoute = (id: string, locale: string): string =>
  `${getAppRoute('ownerJobs', locale)}/${id}`

export const getOwnerJobEditRoute = (id: string, locale: string): string =>
  `${getOwnerJobRoute(id, locale)}/${locale === 'en' ? 'edit' : 'uredi'}`

export const getOwnerJobOffersRoute = (id: string, locale: string): string =>
  `${getOwnerJobRoute(id, locale)}/${locale === 'en' ? 'offers' : locale === 'sl' ? 'ponudbe' : 'ponude'}`

export const getCleanerJobRoute = (id: string, locale: string): string =>
  `${getAppRoute('cleanerJobs', locale)}/${id}`

export const getCleanerOfferRoute = (jobId: string, locale: string): string =>
  `${getCleanerJobRoute(jobId, locale)}/${locale === 'en' ? 'offer' : locale === 'sl' ? 'ponudba' : 'ponuda'}`

export const getJobReviewRoute = (
  role: 'owner' | 'cleaner',
  jobId: string,
  locale: string,
): string => role === 'owner'
  ? `${getOwnerJobRoute(jobId, locale)}/${locale === 'en' ? 'review' : locale === 'sl' ? 'ocena' : 'recenzija'}`
  : `${getCleanerJobRoute(jobId, locale)}/${locale === 'en' ? 'review' : locale === 'sl' ? 'ocena' : 'recenzija'}`
