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
  const events = billing.events(event)
  if (await events.isProcessed(event.id)) return { duplicate: true }
  if (!await events.tryClaim(event.id)) return { duplicate: true }
  const eventCreatedAt = new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString()

  try {
    if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      await billing.syncSubscription(
        await stripe.subscriptions.retrieve(event.data.object.id),
        undefined,
        eventCreatedAt,
      )
    }
    else if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = session.client_reference_id ?? session.metadata?.userId ?? undefined
        await billing.syncSubscription(subscription, userId, eventCreatedAt)
        if (userId) await billing.syncPaymentMethod(userId)
      }
    }
    else if (event.type === 'invoice.paid') {
      const subscriptionId = await billing.recordInvoice(event.data.object, 'paid', eventCreatedAt)
      if (subscriptionId) {
        await billing.syncSubscription(
          await stripe.subscriptions.retrieve(subscriptionId),
          undefined,
          eventCreatedAt,
        )
      }
    }
    else if (
      event.type === 'invoice.payment_failed'
      || event.type === 'invoice.payment_action_required'
    ) {
      const subscriptionId = await billing.recordInvoice(
        event.data.object as Stripe.Invoice,
        'payment_failed',
        eventCreatedAt,
      )
      if (subscriptionId) {
        await billing.syncSubscription(
          await stripe.subscriptions.retrieve(subscriptionId),
          undefined,
          eventCreatedAt,
        )
      }
    }
    await events.complete(event.id)
    return { duplicate: false }
  }
  catch (error) {
    await events.release(event.id)
    throw error
  }
}
