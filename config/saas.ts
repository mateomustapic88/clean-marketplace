export const saasConfig = {
  currency: 'EUR' as const,
  trialDays: 7,
  gracePeriodDays: 3,
  reviewEditDays: 14,
  plans: {
    owner: {
      code: 'owner' as const,
      monthlyAmount: 1900,
      annualAmount: 9900,
    },
    cleaner: {
      code: 'cleaner' as const,
      monthlyAmount: 3900,
      annualAmount: 19900,
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
