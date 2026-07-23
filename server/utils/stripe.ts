import Stripe from 'stripe'
import {
  parseBillingMode,
  validateStripeServerConfiguration,
} from '~/services/billing/billingConfiguration'

export const useStripeServer = () => {
  const config = useRuntimeConfig()
  try {
    validateStripeServerConfiguration(parseBillingMode(config.public.billingMode), {
      secretKey: config.stripeSecretKey,
      ownerPriceId: config.stripeOwnerPriceId,
      cleanerPriceId: config.stripeCleanerPriceId,
    })
  }
  catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe billing configuration is incomplete',
    })
  }
  return new Stripe(config.stripeSecretKey)
}
