export interface SubscriptionSyncCommand {
  userId: string
  eventId: string
  status: 'active' | 'past_due' | 'cancelled'
  stripeCustomerId: string
  stripeSubscriptionId: string
}

interface StripeEventLike {
  id: string
  type: string
  data: {
    object: {
      id?: string
      customer?: string
      subscription?: string
      client_reference_id?: string
      metadata?: Record<string, string>
    }
  }
}

export const mapStripeEvent = (event: StripeEventLike): SubscriptionSyncCommand | null => {
  const object = event.data.object
  const userId = object.metadata?.userId ?? object.client_reference_id
  const subscriptionId = typeof object.subscription === 'string'
    ? object.subscription
    : object.id ?? ''
  const customerId = object.customer ?? ''
  if (!userId || !subscriptionId || !customerId) return null
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
    return { userId, eventId: event.id, status: 'active', stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId }
  }
  if (event.type === 'invoice.payment_failed') {
    return { userId, eventId: event.id, status: 'past_due', stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId }
  }
  if (event.type === 'customer.subscription.deleted') {
    return { userId, eventId: event.id, status: 'cancelled', stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId }
  }
  return null
}
