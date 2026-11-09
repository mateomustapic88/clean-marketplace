import type { CountryCode, CurrencyCode } from '~/domains/shared/types'

const sharedPlanSettings = {
  trialDays: 7,
  gracePeriodDays: 3,
  reviewEditDays: 14,
} as const

export const marketplacePlans = {
  HR: {
    currency: 'EUR',
    owner: { monthlyAmount: 1900, annualAmount: 9900 },
    cleaner: { monthlyAmount: 3900, annualAmount: 19900 },
  },
  US: {
    currency: 'USD',
    owner: { monthlyAmount: 2100, annualAmount: 10900 },
    cleaner: { monthlyAmount: 4300, annualAmount: 21900 },
  },
} as const satisfies Record<CountryCode, {
  currency: CurrencyCode
  owner: { monthlyAmount: number, annualAmount: number }
  cleaner: { monthlyAmount: number, annualAmount: number }
}>

export const getMarketplacePlans = (countryCode: CountryCode) => marketplacePlans[countryCode]

export const saasConfig = {
  ...sharedPlanSettings,
  currency: marketplacePlans.HR.currency,
  plans: {
    owner: {
      code: 'owner' as const,
      ...marketplacePlans.HR.owner,
    },
    cleaner: {
      code: 'cleaner' as const,
      ...marketplacePlans.HR.cleaner,
    },
  },
  features: {
    subscriptions: true,
    notifications: true,
    reviews: true,
    stripeCheckout: true,
    downgrade: false,
  },
} as const
