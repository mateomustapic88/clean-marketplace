import type Stripe from 'stripe'
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

export const hasActiveProviderSubscription = (subscription: Subscription): boolean =>
  ['trial', 'active'].includes(subscription.status) && Boolean(subscription.stripeSubscriptionId)

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
    if (existing && hasActiveProviderSubscription(existing)) {
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
    const [subscription, invoicesResult, methodResult] = await Promise.all([
      this.subscription(userId),
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

  async syncSubscription(stripeSubscription: Stripe.Subscription, fallbackUserId?: string, eventCreatedAt?: string): Promise<Subscription> {
    const patch = subscriptionPatchFromStripe(stripeSubscription)
    const { data: existing } = await this.database.from('subscriptions').select('*')
      .or(`user_id.eq.${stripeSubscription.metadata.userId || fallbackUserId || '00000000-0000-0000-0000-000000000000'},stripe_customer_id.eq.${patch.customerId}`)
      .maybeSingle()
    const userId = stripeSubscription.metadata.userId || fallbackUserId || existing?.user_id
    if (!userId) throw createError({ statusCode: 422, statusMessage: 'Stripe user metadata is missing' })
    if (eventCreatedAt && existing?.stripe_event_created_at && new Date(existing.stripe_event_created_at) > new Date(eventCreatedAt)) {
      return mapSubscription(existing as DbRow)
    }
    const existingPlan: Subscription['plan'] | null
      = existing?.plan === 'owner' || existing?.plan === 'cleaner' ? existing.plan : null
    const plan: Subscription['plan'] | null = patch.plan ?? existingPlan
    if (plan !== 'owner' && plan !== 'cleaner') throw createError({ statusCode: 422, statusMessage: 'Stripe plan metadata is missing' })
    const { data, error } = await this.database.from('subscriptions').upsert({
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
      stripe_event_created_at: eventCreatedAt ?? new Date().toISOString(),
    }).select('*').single()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Subscription projection failed' })
    return mapSubscription(data as DbRow)
  }

  async markInvoice(invoice: Stripe.Invoice, type: 'paid' | 'payment_failed', eventCreatedAt?: string): Promise<void> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    if (!customerId) return
    const { data: subscription } = await this.database.from('subscriptions').select('*').eq('stripe_customer_id', customerId).maybeSingle()
    if (!subscription) return
    if (
      eventCreatedAt
      && subscription.stripe_event_created_at
      && new Date(subscription.stripe_event_created_at) > new Date(eventCreatedAt)
    ) return
    const timestamp = unixIso(invoice.created) ?? new Date().toISOString()
    const graceEnd = new Date(timestamp)
    graceEnd.setUTCDate(graceEnd.getUTCDate() + saasConfig.gracePeriodDays)
    await Promise.all([
      this.database.from('subscriptions').update(type === 'paid'
        ? { status: 'active', grace_period_ends_at: null, last_successful_payment_at: timestamp, stripe_event_created_at: eventCreatedAt }
        : { status: 'past_due', grace_period_ends_at: graceEnd.toISOString(), last_failed_payment_at: timestamp, stripe_event_created_at: eventCreatedAt })
        .eq('user_id', subscription.user_id),
      this.database.from('billing_invoices').upsert(this.invoiceRecord(invoice, subscription.user_id)),
    ])
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
