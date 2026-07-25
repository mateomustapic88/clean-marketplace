import type Stripe from 'stripe'
import { createError } from 'h3'
import { saasConfig } from '~/config/saas'
import type { BillingState } from '~/domains/subscriptions/api'
import type { BillingPeriod, Subscription, SubscriptionStatus } from '~/domains/subscriptions/types'
import { SupabaseStripeEventRepository } from '~/repositories/supabase/SupabaseStripeEventRepository'
import { mapInvoice, mapPaymentMethod, mapSubscription } from '~/repositories/supabase/mappers'
import type { DbRow } from '~/repositories/supabase/mappers'
import { StripeServerGateway } from '~/server/services/StripeServerGateway'
import { createAdminSupabaseClient } from '~/infrastructure/supabase/serverClient'
import { useStripeServer } from '~/server/utils/stripe'

export const statusFromStripe = (status: Stripe.Subscription.Status): SubscriptionStatus => {
  if (status === 'trialing') return 'trial'
  if (status === 'active') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'unpaid') return 'unpaid'
  if (status === 'incomplete') return 'incomplete'
  if (status === 'incomplete_expired') return 'incomplete_expired'
  if (status === 'canceled') return 'cancelled'
  if (status === 'paused') return 'paused'
  return 'expired'
}

const unixIso = (value: number | null | undefined): string | null =>
  value ? new Date(value * 1000).toISOString() : null

export const BILLING_RECONCILIATION_INTERVAL_MS = 5 * 60_000

export const isOlderStripeEvent = (
  existingEventCreatedAt: string | null | undefined,
  incomingEventCreatedAt: string | null | undefined,
): boolean => Boolean(
  existingEventCreatedAt
  && incomingEventCreatedAt
  && new Date(existingEventCreatedAt) > new Date(incomingEventCreatedAt),
)

export const shouldReconcileSubscription = (
  subscription: Subscription,
  now = new Date(),
): boolean => Boolean(
  subscription.stripeSubscriptionId
  && (
    !subscription.updatedAt
    || now.getTime() - new Date(subscription.updatedAt).getTime() >= BILLING_RECONCILIATION_INTERVAL_MS
  ),
)

export const stripeSubscriptionIdFromInvoice = (invoice: Stripe.Invoice): string | null => {
  const subscription = invoice.parent?.subscription_details?.subscription
  if (!subscription) return null
  return typeof subscription === 'string' ? subscription : subscription.id
}

export const invoicePaymentPatch = (
  type: 'paid' | 'payment_failed',
  timestamp: string,
) => {
  if (type === 'paid') {
    return {
      grace_period_ends_at: null,
      last_successful_payment_at: timestamp,
    }
  }
  const graceEnd = new Date(timestamp)
  graceEnd.setUTCDate(graceEnd.getUTCDate() + saasConfig.gracePeriodDays)
  return {
    grace_period_ends_at: graceEnd.toISOString(),
    last_failed_payment_at: timestamp,
  }
}

export const subscriptionPatchFromStripe = (subscription: Stripe.Subscription) => {
  const item = subscription.items.data[0]
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const metadataPlan = subscription.metadata.plan
  const recurringInterval = item?.price.recurring?.interval
  const stripeInterval = recurringInterval === 'year'
    ? 'year' as const
    : recurringInterval === 'month' ? 'month' as const : null
  const plan: Subscription['plan'] | null
    = metadataPlan === 'owner' || metadataPlan === 'cleaner' ? metadataPlan : null
  return {
    customerId,
    plan,
    status: statusFromStripe(subscription.status),
    stripeSubscriptionId: subscription.id,
    stripePriceId: item?.price.id ?? null,
    unitAmount: item?.price.unit_amount ?? null,
    billingPeriod: stripeInterval === 'year' || subscription.metadata.billingPeriod === 'annual'
      ? 'annual' as const
      : 'monthly' as const,
    stripeInterval,
    trialStartedAt: unixIso(subscription.trial_start),
    trialEndsAt: unixIso(subscription.trial_end),
    currentPeriodStartedAt: unixIso(item?.current_period_start),
    currentPeriodEndsAt: unixIso(item?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelledAt: unixIso(subscription.canceled_at),
  }
}

export const blocksNewProviderCheckout = (subscription: Subscription): boolean =>
  Boolean(subscription.stripeSubscriptionId) && ![
    'cancelled',
    'expired',
    'incomplete_expired',
  ].includes(subscription.status)

export class StripeBillingService {
  private readonly database = createAdminSupabaseClient()

  events(event: Stripe.Event) {
    return new SupabaseStripeEventRepository(
      this.database,
      event.type,
      new Date(event.created * 1000).toISOString(),
    )
  }

  async checkout(userId: string, role: 'owner' | 'cleaner', billingPeriod: BillingPeriod, email: string, successUrl: string, cancelUrl: string) {
    const existing = await this.subscription(userId)
    if (existing && blocksNewProviderCheckout(existing)) {
      throw createError({ statusCode: 409, statusMessage: 'An active subscription already exists' })
    }
    let customerId = existing?.stripeCustomerId
    if (!customerId) {
      const customer = await this.stripe().customers.create({ email, metadata: { userId, role } })
      customerId = customer.id
      const { error } = await this.database.from('subscriptions').upsert({
        user_id: userId, plan: role, status: 'incomplete',
        unit_amount_cents: saasConfig.plans[role][billingPeriod === 'annual' ? 'annualAmount' : 'monthlyAmount'],
        billing_period: billingPeriod, stripe_interval: billingPeriod === 'annual' ? 'year' : 'month', currency: 'EUR',
        stripe_customer_id: customerId, trial_consumed: false,
      })
      if (error) throw createError({ statusCode: 500, statusMessage: 'Billing state could not be persisted' })
    }
    return this.gateway().createCheckout({
      userId, plan: role, billingPeriod, customerId, successUrl, cancelUrl,
      trialDays: existing?.trialConsumed ? 0 : saasConfig.trialDays,
    })
  }

  async portal(userId: string, returnUrl: string) {
    const subscription = await this.requiredSubscription(userId)
    if (!subscription.stripeCustomerId) throw createError({ statusCode: 409, statusMessage: 'Stripe customer is missing' })
    return this.gateway().createCustomerPortal(subscription.stripeCustomerId, returnUrl)
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.requiredProviderSubscription(userId)
    return this.syncSubscription(await this.stripe().subscriptions.update(
      subscription.stripeSubscriptionId!, { cancel_at_period_end: true },
    ), userId)
  }

  async resume(userId: string): Promise<Subscription> {
    const subscription = await this.requiredProviderSubscription(userId)
    return this.syncSubscription(await this.stripe().subscriptions.update(
      subscription.stripeSubscriptionId!, { cancel_at_period_end: false },
    ), userId)
  }

  async state(userId: string, _role: 'owner' | 'cleaner'): Promise<BillingState> {
    let subscription = await this.subscription(userId)
    if (subscription && shouldReconcileSubscription(subscription)) {
      subscription = await this.syncSubscription(
        await this.stripe().subscriptions.retrieve(subscription.stripeSubscriptionId!),
        userId,
        undefined,
        subscription.updatedAt,
      )
    }
    const [invoicesResult, methodResult] = await Promise.all([
      this.database.from('billing_invoices').select('*').eq('user_id', userId).order('issued_at', { ascending: false }).limit(20),
      this.database.from('payment_methods').select('*').eq('user_id', userId).eq('is_default', true).maybeSingle(),
    ])
    if (invoicesResult.error || methodResult.error) throw createError({ statusCode: 500, statusMessage: 'Billing state could not be loaded' })
    return {
      subscription,
      invoices: (invoicesResult.data as DbRow[]).map(mapInvoice),
      paymentMethod: methodResult.data ? mapPaymentMethod(methodResult.data as DbRow) : null,
    }
  }

  async syncSubscription(
    stripeSubscription: Stripe.Subscription,
    fallbackUserId?: string,
    eventCreatedAt?: string,
    expectedUpdatedAt?: string,
    attempt = 0,
  ): Promise<Subscription> {
    const patch = subscriptionPatchFromStripe(stripeSubscription)
    const { data: existing, error: existingError } = await this.database.from('subscriptions').select('*')
      .or(`user_id.eq.${stripeSubscription.metadata.userId || fallbackUserId || '00000000-0000-0000-0000-000000000000'},stripe_customer_id.eq.${patch.customerId}`)
      .maybeSingle()
    if (existingError) throw createError({ statusCode: 500, statusMessage: 'Subscription projection could not be loaded' })
    const userId = stripeSubscription.metadata.userId || fallbackUserId || existing?.user_id
    if (!userId) throw createError({ statusCode: 422, statusMessage: 'Stripe user metadata is missing' })
    if (existing?.user_id && existing.user_id !== userId) {
      throw createError({ statusCode: 409, statusMessage: 'Stripe subscription user mismatch' })
    }
    if (expectedUpdatedAt && existing?.updated_at !== expectedUpdatedAt) {
      return mapSubscription(existing as DbRow)
    }
    if (isOlderStripeEvent(existing?.stripe_event_created_at, eventCreatedAt)) {
      return mapSubscription(existing as DbRow)
    }
    const existingPlan: Subscription['plan'] | null
      = existing?.plan === 'owner' || existing?.plan === 'cleaner' ? existing.plan : null
    const plan: Subscription['plan'] | null = patch.plan ?? existingPlan
    if (plan !== 'owner' && plan !== 'cleaner') throw createError({ statusCode: 422, statusMessage: 'Stripe plan metadata is missing' })
    const projection = {
      user_id: userId, plan, status: patch.status,
      unit_amount_cents: patch.unitAmount ?? existing?.unit_amount_cents ?? saasConfig.plans[plan].monthlyAmount,
      billing_period: patch.billingPeriod,
      stripe_interval: patch.stripeInterval,
      currency: 'EUR', stripe_customer_id: patch.customerId,
      stripe_subscription_id: patch.stripeSubscriptionId, stripe_price_id: patch.stripePriceId,
      trial_started_at: patch.trialStartedAt, trial_ends_at: patch.trialEndsAt,
      trial_consumed: Boolean(patch.trialStartedAt) || existing?.trial_consumed,
      current_period_started_at: patch.currentPeriodStartedAt, current_period_ends_at: patch.currentPeriodEndsAt,
      cancel_at_period_end: patch.cancelAtPeriodEnd, cancelled_at: patch.cancelledAt,
      stripe_event_created_at: eventCreatedAt ?? existing?.stripe_event_created_at ?? null,
    }
    if (!existing) {
      const { data, error } = await this.database.from('subscriptions').insert(projection).select('*').single()
      if (!error) return mapSubscription(data as DbRow)
      if (error.code !== '23505' || attempt >= 2) {
        throw createError({ statusCode: 500, statusMessage: 'Subscription projection failed' })
      }
      return this.syncSubscription(
        stripeSubscription,
        fallbackUserId,
        eventCreatedAt,
        expectedUpdatedAt,
        attempt + 1,
      )
    }
    const { data, error } = await this.database.from('subscriptions').update(projection)
      .eq('user_id', userId)
      .eq('updated_at', existing.updated_at)
      .select('*')
      .maybeSingle()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Subscription projection failed' })
    if (data) return mapSubscription(data as DbRow)
    if (attempt >= 2) throw createError({ statusCode: 409, statusMessage: 'Concurrent subscription update could not be resolved' })
    return this.syncSubscription(
      stripeSubscription,
      fallbackUserId,
      eventCreatedAt,
      expectedUpdatedAt,
      attempt + 1,
    )
  }

  async recordInvoice(
    invoice: Stripe.Invoice,
    type: 'paid' | 'payment_failed',
    eventCreatedAt?: string,
    attempt = 0,
  ): Promise<string | null> {
    const invoiceSubscriptionId = stripeSubscriptionIdFromInvoice(invoice)
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    if (!customerId) return invoiceSubscriptionId
    const { data: subscription, error: subscriptionError } = await this.database.from('subscriptions').select('*')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (subscriptionError) throw createError({ statusCode: 500, statusMessage: 'Invoice subscription could not be loaded' })
    if (!subscription) return invoiceSubscriptionId
    if (isOlderStripeEvent(subscription.stripe_event_created_at, eventCreatedAt)) return null
    const timestamp = unixIso(invoice.created) ?? new Date().toISOString()
    const { data: updated, error: updateError } = await this.database.from('subscriptions').update({
      ...invoicePaymentPatch(type, timestamp),
      stripe_event_created_at: eventCreatedAt,
    })
      .eq('user_id', subscription.user_id)
      .eq('updated_at', subscription.updated_at)
      .select('user_id, stripe_subscription_id')
      .maybeSingle()
    if (updateError) throw createError({ statusCode: 500, statusMessage: 'Invoice projection failed' })
    if (!updated) {
      if (attempt >= 2) throw createError({ statusCode: 409, statusMessage: 'Concurrent invoice update could not be resolved' })
      return this.recordInvoice(invoice, type, eventCreatedAt, attempt + 1)
    }
    const { error: invoiceError } = await this.database.from('billing_invoices')
      .upsert(this.invoiceRecord(invoice, subscription.user_id))
    if (invoiceError) throw createError({ statusCode: 500, statusMessage: 'Invoice projection failed' })
    return invoiceSubscriptionId ?? updated.stripe_subscription_id ?? null
  }

  async syncPaymentMethod(userId: string): Promise<void> {
    const subscription = await this.subscription(userId)
    if (!subscription?.stripeCustomerId) return
    const methods = await this.stripe().paymentMethods.list({ customer: subscription.stripeCustomerId, type: 'card', limit: 1 })
    const method = methods.data[0]
    if (!method?.card) return
    await this.database.from('payment_methods').upsert({
      id: method.id, user_id: userId, brand: method.card.brand, last4: method.card.last4,
      expiry_month: method.card.exp_month, expiry_year: method.card.exp_year, is_default: true,
    })
  }

  private async subscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.database.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Billing state could not be loaded' })
    return data ? mapSubscription(data as DbRow) : null
  }

  private async requiredSubscription(userId: string) {
    const value = await this.subscription(userId)
    if (!value) throw createError({ statusCode: 404, statusMessage: 'Subscription not found' })
    return value
  }

  private async requiredProviderSubscription(userId: string) {
    const value = await this.requiredSubscription(userId)
    if (!value.stripeSubscriptionId) throw createError({ statusCode: 409, statusMessage: 'Stripe subscription is missing' })
    return value
  }

  private stripe(): Stripe { return useStripeServer() }

  private gateway(): StripeServerGateway {
    const config = useRuntimeConfig()
    return new StripeServerGateway(this.stripe(), {
      owner: { monthly: config.stripeOwnerMonthlyPriceId, annual: config.stripeOwnerAnnualPriceId },
      cleaner: { monthly: config.stripeCleanerMonthlyPriceId, annual: config.stripeCleanerAnnualPriceId },
    })
  }

  private invoiceRecord(invoice: Stripe.Invoice, userId: string) {
    return {
      id: invoice.id, user_id: userId, number: invoice.number ?? invoice.id,
      amount_paid_cents: invoice.amount_paid, currency: 'EUR',
      status: invoice.status === 'draft' ? 'open' : invoice.status ?? 'open',
      issued_at: unixIso(invoice.created), hosted_invoice_url: invoice.hosted_invoice_url,
    }
  }
}
