import type Stripe from 'stripe'

export const requireWebhookSecret = (value: string): string => {
  if (value) return value
  console.warn('[billing] Stripe webhook is unavailable because its signing secret is not configured.')
  throw new Error('Stripe webhook is not configured')
}

export const verifyStripeWebhookEvent = (
  stripe: Stripe,
  rawBody: string,
  signature: string,
  secret: string,
): Stripe.Event => stripe.webhooks.constructEvent(rawBody, signature, secret)
