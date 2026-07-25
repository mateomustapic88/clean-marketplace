export interface SubscriptionSyncCommand {
  userId: string
  eventId: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled'
  stripeCustomerId: string
  stripeSubscriptionId: string
}

interface StripeEventLike {
  id: string
  type: string
  data: {
    object: {
      id?: string
      status?: string
      customer?: string
      subscription?: string
      client_reference_id?: string
      metadata?: Record<string, string>
    }
  }
}

export const mapStripeEvent = (event: StripeEventLike): SubscriptionSyncCommand | null => {
  const object = event.data.object
  const userId = object.metadata?.userId
  const subscriptionId = object.id ?? ''
  const customerId = object.customer ?? ''
  if (!userId || !subscriptionId || !customerId) return null
  if (event.type === 'customer.subscription.deleted') {
    return { userId, eventId: event.id, status: 'cancelled', stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId }
  }
  if (
    event.type === 'customer.subscription.created'
    || event.type === 'customer.subscription.updated'
  ) {
    const status = object.status === 'trialing'
      ? 'trial'
      : object.status === 'active'
        ? 'active'
        : object.status === 'past_due' ? 'past_due' : null
    return status
      ? { userId, eventId: event.id, status, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId }
      : null
  }
  return null
}
