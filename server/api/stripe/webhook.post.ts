import type Stripe from 'stripe'
import {
  createError,
  defineEventHandler,
  getHeader,
  readRawBody,
} from 'h3'
import { StripeBillingService } from '~/server/services/StripeBillingService'
import { processVerifiedStripeEvent } from '~/server/services/processStripeWebhook'
import { useStripeServer } from '~/server/utils/stripe'
import {
  requireWebhookSecret,
  verifyStripeWebhookEvent,
} from '~/server/utils/webhookConfiguration'
import { enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'stripe-webhook', 120)
  const config = useRuntimeConfig()
  let webhookSecret: string
  try {
    webhookSecret = requireWebhookSecret(config.stripeWebhookSecret)
  }
  catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe webhook is not configured',
    })
  }
  const signature = getHeader(event, 'stripe-signature')
  if (!signature) throw createError({ statusCode: 400, statusMessage: 'Missing Stripe signature' })
  const body = await readRawBody(event)
  if (!body) throw createError({ statusCode: 400, statusMessage: 'Missing webhook body' })
  const stripe = useStripeServer()
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = verifyStripeWebhookEvent(
      stripe,
      body,
      signature,
      webhookSecret,
    )
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Stripe signature' })
  }
  const billing = new StripeBillingService()
  const result = await processVerifiedStripeEvent(stripeEvent, billing, stripe)
  return { received: true, eventId: stripeEvent.id, ...result }
})
