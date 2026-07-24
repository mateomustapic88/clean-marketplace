import type { UserRole } from '~/domains/users/types'

export type SupportedLocale = 'hr' | 'en'

const routePaths = {
  home: {
    hr: '/',
    en: '/en',
  },
  login: {
    hr: '/prijava',
    en: '/en/login',
  },
  register: {
    hr: '/registracija',
    en: '/en/register',
  },
  forgotPassword: {
    hr: '/zaboravljena-lozinka',
    en: '/en/forgot-password',
  },
  jobs: {
    hr: '/poslovi',
    en: '/en/jobs',
  },
  cleaners: {
    hr: '/cistaci',
    en: '/en/cleaners',
  },
  howItWorks: {
    hr: '/kako-funkcionira',
    en: '/en/how-it-works',
  },
  pricing: {
    hr: '/cijene',
    en: '/en/pricing',
  },
  contact: {
    hr: '/kontakt',
    en: '/en/contact',
  },
  privacy: {
    hr: '/politika-privatnosti',
    en: '/en/privacy',
  },
  terms: {
    hr: '/uvjeti-koristenja',
    en: '/en/terms',
  },
  cookies: {
    hr: '/politika-kolacica',
    en: '/en/cookie-policy',
  },
  forbidden: {
    hr: '/zabranjeno',
    en: '/en/forbidden',
  },
  ownerDashboard: {
    hr: '/dashboard',
    en: '/en/dashboard',
  },
  ownerJobs: {
    hr: '/dashboard/poslovi',
    en: '/en/dashboard/jobs',
  },
  ownerNewJob: {
    hr: '/dashboard/poslovi/novi',
    en: '/en/dashboard/jobs/new',
  },
  ownerProfile: {
    hr: '/dashboard/profil',
    en: '/en/dashboard/profile',
  },
  ownerSettings: {
    hr: '/dashboard/postavke',
    en: '/en/dashboard/settings',
  },
  ownerBilling: {
    hr: '/dashboard/billing',
    en: '/en/dashboard/billing',
  },
  ownerNotifications: {
    hr: '/dashboard/obavijesti',
    en: '/en/dashboard/notifications',
  },
  cleanerDashboard: {
    hr: '/dashboard-cleaner',
    en: '/en/dashboard-cleaner',
  },
  cleanerJobs: {
    hr: '/dashboard-cleaner/poslovi',
    en: '/en/dashboard-cleaner/jobs',
  },
  cleanerFavourites: {
    hr: '/dashboard-cleaner/favoriti',
    en: '/en/dashboard-cleaner/favourites',
  },
  cleanerOffers: {
    hr: '/dashboard-cleaner/ponude',
    en: '/en/dashboard-cleaner/offers',
  },
  cleanerAcceptedJobs: {
    hr: '/dashboard-cleaner/prihvaceni-poslovi',
    en: '/en/dashboard-cleaner/accepted-jobs',
  },
  cleanerProfile: {
    hr: '/dashboard-cleaner/profil',
    en: '/en/dashboard-cleaner/profile',
  },
  cleanerAvailability: {
    hr: '/dashboard-cleaner/dostupnost',
    en: '/en/dashboard-cleaner/availability',
  },
  cleanerBilling: {
    hr: '/dashboard-cleaner/billing',
    en: '/en/dashboard-cleaner/billing',
  },
  cleanerNotifications: {
    hr: '/dashboard-cleaner/obavijesti',
    en: '/en/dashboard-cleaner/notifications',
  },
  adminDashboard: {
    hr: '/admin',
    en: '/en/admin',
  },
  ownerOnboarding: {
    hr: '/onboarding/vlasnik',
    en: '/en/onboarding/owner',
  },
  cleanerOnboarding: {
    hr: '/onboarding/cistac',
    en: '/en/onboarding/cleaner',
  },
} as const

export type AppRouteKey = keyof typeof routePaths

export const getAppRoute = (
  route: AppRouteKey,
  locale: string,
): string => routePaths[route][locale === 'en' ? 'en' : 'hr']

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
  `${getOwnerJobRoute(id, locale)}/${locale === 'en' ? 'offers' : 'ponude'}`

export const getCleanerJobRoute = (id: string, locale: string): string =>
  `${getAppRoute('cleanerJobs', locale)}/${id}`

export const getCleanerOfferRoute = (jobId: string, locale: string): string =>
  `${getCleanerJobRoute(jobId, locale)}/${locale === 'en' ? 'offer' : 'ponuda'}`

export const getJobReviewRoute = (
  role: 'owner' | 'cleaner',
  jobId: string,
  locale: string,
): string => role === 'owner'
  ? `${getOwnerJobRoute(jobId, locale)}/${locale === 'en' ? 'review' : 'recenzija'}`
  : `${getCleanerJobRoute(jobId, locale)}/${locale === 'en' ? 'review' : 'recenzija'}`
