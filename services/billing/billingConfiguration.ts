export type BillingMode = 'mock' | 'stripe'

export interface StripeServerConfiguration {
  secretKey: string
  ownerPriceId: string
  cleanerPriceId: string
}

export const parseBillingMode = (value: string | undefined): BillingMode => {
  const mode = value || 'stripe'
  if (mode !== 'mock' && mode !== 'stripe') {
    throw new Error('BILLING_MODE must be either "mock" or "stripe"')
  }
  return mode
}

export const validateStripeServerConfiguration = (
  mode: BillingMode,
  configuration: StripeServerConfiguration,
): void => {
  if (mode === 'mock') return
  if (
    !configuration.secretKey
    || !configuration.ownerPriceId
    || !configuration.cleanerPriceId
  ) {
    throw new Error('Stripe billing configuration is incomplete')
  }
}
