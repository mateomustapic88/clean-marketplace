import type Stripe from 'stripe'
import { saasConfig } from '~/config/saas'
import type { BillingState } from '~/domains/subscriptions/api'
import type {
  BillingInvoice,
  PaymentMethod,
  Subscription,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'
import { nowIso } from '~/repositories/mock/helpers'
import { MockSubscriptionRepository } from '~/repositories/mock/MockSubscriptionRepository'
import { MockStripeEventRepository } from '~/repositories/mock/MockStripeEventRepository'
import { createNotification } from '~/services/notifications/notificationFactory'
import { trialRemainingDays } from '~/services/subscriptions/subscriptionAccess'
import { StripeServerGateway } from '~/server/services/StripeServerGateway'
import { useBillingDatabase } from '~/server/utils/billingDatabase'
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

export const subscriptionPatchFromStripe = (
  stripeSubscription: Stripe.Subscription,
) => {
  const item = stripeSubscription.items.data[0]
  const customerId = typeof stripeSubscription.customer === 'string'
    ? stripeSubscription.customer
    : stripeSubscription.customer.id
  const metadataPlan = stripeSubscription.metadata.plan
  const plan: Subscription['plan'] | null
    = metadataPlan === 'owner' || metadataPlan === 'cleaner'
      ? metadataPlan
      : null
  return {
    customerId,
    plan,
    status: statusFromStripe(stripeSubscription.status),
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: item?.price.id ?? null,
    unitAmount: item?.price.unit_amount ?? null,
    trialStartedAt: unixIso(stripeSubscription.trial_start),
    trialEndsAt: unixIso(stripeSubscription.trial_end),
    currentPeriodStartedAt: unixIso(item?.current_period_start),
    currentPeriodEndsAt: unixIso(item?.current_period_end),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    cancelledAt: unixIso(stripeSubscription.canceled_at),
  }
}

export const hasActiveProviderSubscription = (
  subscription: Subscription,
): boolean => subscription.status === 'active'
  && Boolean(subscription.stripeSubscriptionId)
  && !subscription.stripeSubscriptionId?.startsWith('sub_demo_')

export class StripeBillingService {
  private readonly database = useBillingDatabase()
  private readonly subscriptions = new MockSubscriptionRepository(this.database)
  readonly events = new MockStripeEventRepository(this.database)

  async ensureSubscription(userId: string, role: 'owner' | 'cleaner'): Promise<Subscription> {
    const subscription = await this.subscriptions.ensureTrial(userId, role)
    const hasDemoProviderIds = subscription.stripeCustomerId?.startsWith('cus_demo_')
      || subscription.stripeSubscriptionId?.startsWith('sub_demo_')
    if (useRuntimeConfig().public.billingMode !== 'stripe' || !hasDemoProviderIds) {
      return subscription
    }
    return this.database.transaction((snapshot) => {
      const current = snapshot.subscriptions.find((item) => item.userId === userId)!
      current.stripeCustomerId = null
      current.stripeSubscriptionId = null
      current.stripePriceId = null
      if (current.status === 'active' && !current.trialEndsAt) current.status = 'expired'
      current.updatedAt = nowIso()
      return current
    })
  }

  async checkout(
    userId: string,
    role: 'owner' | 'cleaner',
    email: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const subscription = await this.ensureSubscription(userId, role)
    if (hasActiveProviderSubscription(subscription)) {
      throw createError({ statusCode: 409, statusMessage: 'An active subscription already exists' })
    }
    let customerId = subscription.stripeCustomerId
    if (!customerId) {
      const customer = await this.stripe().customers.create({
        email,
        metadata: { userId, role },
      })
      customerId = customer.id
      this.database.transaction((snapshot) => {
        const current = snapshot.subscriptions.find((item) => item.userId === userId)!
        current.stripeCustomerId = customer.id
        current.updatedAt = nowIso()
        return current
      })
    }
    const config = useRuntimeConfig()
    const gateway = new StripeServerGateway(this.stripe(), {
      owner: config.stripeOwnerPriceId,
      cleaner: config.stripeCleanerPriceId,
    })
    return gateway.createCheckout({
      userId,
      plan: role,
      customerId,
      successUrl,
      cancelUrl,
      trialDays: trialRemainingDays(subscription),
    })
  }

  async portal(userId: string, returnUrl: string) {
    const subscription = await this.requiredSubscription(userId)
    if (!subscription.stripeCustomerId) {
      throw createError({ statusCode: 409, statusMessage: 'Stripe customer is missing' })
    }
    const config = useRuntimeConfig()
    const gateway = new StripeServerGateway(this.stripe(), {
      owner: config.stripeOwnerPriceId,
      cleaner: config.stripeCleanerPriceId,
    })
    return gateway.createCustomerPortal(subscription.stripeCustomerId, returnUrl)
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.requiredSubscription(userId)
    if (!subscription.stripeSubscriptionId) {
      return this.subscriptions.cancel(userId)
    }
    const updated = await this.stripe().subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true },
    )
    return this.syncSubscription(updated, userId)
  }

  async resume(userId: string): Promise<Subscription> {
    const subscription = await this.requiredSubscription(userId)
    if (!subscription.stripeSubscriptionId) {
      return this.subscriptions.resume(userId)
    }
    const updated = await this.stripe().subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false },
    )
    return this.syncSubscription(updated, userId)
  }

  async state(userId: string, role: 'owner' | 'cleaner'): Promise<BillingState> {
    const subscription = await this.ensureSubscription(userId, role)
    if (!subscription.stripeCustomerId) {
      return {
        subscription,
        invoices: await this.subscriptions.listInvoices(userId),
        paymentMethod: await this.subscriptions.getPaymentMethod(userId),
      }
    }
    const [stripeInvoices, methods] = await Promise.all([
      this.stripe().invoices.list({ customer: subscription.stripeCustomerId, limit: 20 }),
      this.stripe().paymentMethods.list({
        customer: subscription.stripeCustomerId,
        type: 'card',
        limit: 10,
      }),
    ])
    return {
      subscription,
      invoices: stripeInvoices.data.map((invoice) => this.mapInvoice(invoice, userId)),
      paymentMethod: this.mapPaymentMethod(methods.data[0], userId),
    }
  }

  syncSubscription(stripeSubscription: Stripe.Subscription, fallbackUserId?: string): Subscription {
    const patch = subscriptionPatchFromStripe(stripeSubscription)
    const snapshot = this.database.read()
    const userId = stripeSubscription.metadata.userId
      || fallbackUserId
      || snapshot.subscriptions.find((item) => item.stripeCustomerId === patch.customerId)?.userId
    if (!userId) throw createError({ statusCode: 422, statusMessage: 'Stripe user metadata is missing' })
    return this.database.transaction((current) => {
      const subscription = current.subscriptions.find((item) => item.userId === userId)
      if (!subscription) throw createError({ statusCode: 404, statusMessage: 'Subscription not found' })
      subscription.status = patch.status
      subscription.stripeCustomerId = patch.customerId
      subscription.stripeSubscriptionId = patch.stripeSubscriptionId
      subscription.stripePriceId = patch.stripePriceId
      if (patch.plan) subscription.plan = patch.plan
      subscription.unitAmount = patch.unitAmount ?? subscription.unitAmount
      subscription.currency = saasConfig.currency
      subscription.trialStartedAt = patch.trialStartedAt
      subscription.trialEndsAt = patch.trialEndsAt
      subscription.currentPeriodStartedAt = patch.currentPeriodStartedAt
      subscription.currentPeriodEndsAt = patch.currentPeriodEndsAt
      subscription.cancelAtPeriodEnd = patch.cancelAtPeriodEnd
      subscription.cancelledAt = patch.cancelledAt
      subscription.updatedAt = nowIso()
      return subscription
    })
  }

  markInvoice(
    invoice: Stripe.Invoice,
    type: 'paid' | 'payment_failed',
  ): void {
    const customerId = typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id
    if (!customerId) return
    this.database.transaction((snapshot) => {
      const subscription = snapshot.subscriptions.find((item) => item.stripeCustomerId === customerId)
      if (!subscription) return
      if (type === 'payment_failed') {
        const graceEnd = new Date()
        graceEnd.setUTCDate(graceEnd.getUTCDate() + saasConfig.gracePeriodDays)
        subscription.status = 'past_due'
        subscription.gracePeriodEndsAt = graceEnd.toISOString()
        subscription.lastFailedPaymentAt = unixIso(invoice.created)
        snapshot.notifications.push(createNotification(
          subscription.userId,
          'subscription_payment_issue',
          subscription.id,
        ))
      }
      else {
        subscription.status = 'active'
        subscription.gracePeriodEndsAt = null
        subscription.lastSuccessfulPaymentAt = unixIso(invoice.created)
        snapshot.notifications.push(createNotification(
          subscription.userId,
          'subscription_renewal',
          subscription.id,
        ))
      }
      subscription.updatedAt = nowIso()
      const mapped = this.mapInvoice(invoice, subscription.userId)
      const index = snapshot.invoices.findIndex((item) => item.id === mapped.id)
      if (index >= 0) snapshot.invoices[index] = mapped
      else snapshot.invoices.push(mapped)
    })
  }

  private async requiredSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptions.getByUserId(userId)
    if (!subscription) throw createError({ statusCode: 404, statusMessage: 'Subscription not found' })
    return subscription
  }

  private stripe(): Stripe {
    return useStripeServer()
  }

  private mapInvoice(invoice: Stripe.Invoice, userId: string): BillingInvoice {
    return {
      id: invoice.id,
      isDemo: false,
      createdAt: unixIso(invoice.created) ?? nowIso(),
      updatedAt: nowIso(),
      userId,
      number: invoice.number ?? invoice.id,
      amountPaid: invoice.amount_paid,
      currency: saasConfig.currency,
      status: invoice.status === 'draft' ? 'open' : invoice.status ?? 'open',
      issuedAt: unixIso(invoice.created) ?? nowIso(),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    }
  }

  private mapPaymentMethod(method: Stripe.PaymentMethod | undefined, userId: string): PaymentMethod | null {
    if (!method?.card) return null
    return {
      id: method.id,
      isDemo: false,
      createdAt: unixIso(method.created) ?? nowIso(),
      updatedAt: nowIso(),
      userId,
      brand: method.card.brand,
      last4: method.card.last4,
      expiryMonth: method.card.exp_month,
      expiryYear: method.card.exp_year,
      isDefault: true,
    }
  }
}
