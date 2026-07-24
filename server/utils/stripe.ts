import Stripe from 'stripe'
import { createError } from 'h3'
import {
  parseBillingMode,
  validateStripeServerConfiguration,
} from '~/services/billing/billingConfiguration'

export const useStripeServer = () => {
  const config = useRuntimeConfig()
  try {
    validateStripeServerConfiguration(parseBillingMode(config.public.billingMode), {
      secretKey: config.stripeSecretKey,
      ownerMonthlyPriceId: config.stripeOwnerMonthlyPriceId,
      ownerAnnualPriceId: config.stripeOwnerAnnualPriceId,
      cleanerMonthlyPriceId: config.stripeCleanerMonthlyPriceId,
      cleanerAnnualPriceId: config.stripeCleanerAnnualPriceId,
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
