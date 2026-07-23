import type Stripe from 'stripe'
import type { StripeBillingService } from '~/server/services/StripeBillingService'

export interface WebhookProcessingResult {
  duplicate: boolean
}

export const processVerifiedStripeEvent = async (
  event: Stripe.Event,
  billing: StripeBillingService,
  stripe: Stripe,
): Promise<WebhookProcessingResult> => {
  if (await billing.events.isProcessed(event.id)) return { duplicate: true }
  if (!await billing.events.tryClaim(event.id)) return { duplicate: true }

  try {
    if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      billing.syncSubscription(event.data.object)
    }
    else if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        billing.syncSubscription(subscription, session.client_reference_id ?? undefined)
      }
    }
    else if (event.type === 'invoice.paid') {
      billing.markInvoice(event.data.object, 'paid')
    }
    else if (
      event.type === 'invoice.payment_failed'
      || event.type === 'invoice.payment_action_required'
    ) {
      billing.markInvoice(event.data.object as Stripe.Invoice, 'payment_failed')
    }
    await billing.events.complete(event.id)
    return { duplicate: false }
  }
  catch (error) {
    await billing.events.release(event.id)
    throw error
  }
}
