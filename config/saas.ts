export const saasConfig = {
  currency: 'EUR' as const,
  trialDays: 7,
  gracePeriodDays: 3,
  reviewEditDays: 14,
  plans: {
    owner: {
      code: 'owner' as const,
      monthlyAmount: 1900,
      stripePriceIdEnv: 'STRIPE_OWNER_PRICE_ID',
    },
    cleaner: {
      code: 'cleaner' as const,
      monthlyAmount: 3900,
      stripePriceIdEnv: 'STRIPE_CLEANER_PRICE_ID',
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
