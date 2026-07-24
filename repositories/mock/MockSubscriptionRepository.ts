import { saasConfig } from '~/config/saas'
import { DomainError } from '~/domains/shared/errors'
import type {
  BillingInvoice,
  BillingPeriod,
  PaymentMethod,
  Subscription,
  SubscriptionCapability,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'
import type { UserRole } from '~/domains/users/types'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'
import { clone, createId, nowIso } from '~/repositories/mock/helpers'
import type { SubscriptionRepository } from '~/repositories/subscriptions/SubscriptionRepository'
import { createNotification } from '~/services/notifications/notificationFactory'
import {
  canUseSubscriptionCapability,
  createTrialDates,
} from '~/services/subscriptions/subscriptionAccess'

export class MockSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly database: MockDatabase) {}

  async getByUserId(userId: string): Promise<Subscription | null> {
    return clone(this.database.read().subscriptions.find((item) => item.userId === userId) ?? null)
  }

  async ensureTrial(userId: string, role: Exclude<UserRole, 'admin'>): Promise<Subscription> {
    return this.database.transaction((snapshot) => {
      const existing = snapshot.subscriptions.find((item) => item.userId === userId)
      if (existing) return existing
      const timestamp = nowIso()
      const trial = createTrialDates(new Date(timestamp))
      const plan = role === 'owner' ? 'owner' : 'cleaner'
      const subscription: Subscription = {
        id: createId('subscription'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId,
        plan,
        status: 'trial',
        unitAmount: saasConfig.plans[plan].monthlyAmount,
        billingPeriod: 'monthly',
        stripeInterval: 'month',
        currency: saasConfig.currency,
        trialStartedAt: trial.startedAt,
        trialEndsAt: trial.endsAt,
        trialConsumed: true,
        currentPeriodStartedAt: null,
        currentPeriodEndsAt: null,
        cancelledAt: null,
        cancelAtPeriodEnd: false,
        gracePeriodEndsAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        lastSuccessfulPaymentAt: null,
        lastFailedPaymentAt: null,
      }
      snapshot.subscriptions.push(subscription)
      return subscription
    })
  }

  async list(): Promise<Subscription[]> {
    return clone(this.database.read().subscriptions)
  }

  async listInvoices(userId: string): Promise<BillingInvoice[]> {
    return clone(this.database.read().invoices.filter((invoice) => invoice.userId === userId))
  }

  async getPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    return clone(this.database.read().paymentMethods.find((method) => method.userId === userId && method.isDefault) ?? null)
  }

  async updateStatus(userId: string, status: SubscriptionStatus): Promise<Subscription> {
    return this.update(userId, (subscription) => {
      subscription.status = status
      subscription.cancelledAt = status === 'cancelled' ? nowIso() : null
    })
  }

  async cancel(userId: string): Promise<Subscription> {
    return this.update(userId, (subscription) => {
      subscription.cancelAtPeriodEnd = true
      subscription.cancelledAt = nowIso()
    })
  }

  async resume(userId: string): Promise<Subscription> {
    return this.update(userId, (subscription) => {
      subscription.cancelAtPeriodEnd = false
      subscription.cancelledAt = null
      if (subscription.status === 'cancelled') subscription.status = 'active'
    })
  }

  async activateFromCheckout(userId: string, customerId: string, stripeSubscriptionId: string, billingPeriod: BillingPeriod): Promise<Subscription> {
    return this.database.transaction((snapshot) => {
      const subscription = this.find(snapshot.subscriptions, userId)
      const timestamp = nowIso()
      const periodEnd = new Date(timestamp)
      if (billingPeriod === 'annual') periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1)
      else periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1)
      subscription.status = 'active'
      subscription.billingPeriod = billingPeriod
      subscription.stripeInterval = billingPeriod === 'annual' ? 'year' : 'month'
      subscription.unitAmount = saasConfig.plans[subscription.plan][billingPeriod === 'annual' ? 'annualAmount' : 'monthlyAmount']
      subscription.stripeCustomerId = customerId
      subscription.stripeSubscriptionId = stripeSubscriptionId
      subscription.currentPeriodStartedAt = timestamp
      subscription.currentPeriodEndsAt = periodEnd.toISOString()
      subscription.gracePeriodEndsAt = null
      subscription.cancelAtPeriodEnd = false
      subscription.updatedAt = timestamp
      snapshot.invoices.push({
        id: createId('invoice'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId,
        number: `DEMO-${snapshot.invoices.length + 1}`,
        amountPaid: subscription.unitAmount,
        currency: subscription.currency,
        status: 'paid',
        issuedAt: timestamp,
        hostedInvoiceUrl: null,
      })
      if (!snapshot.paymentMethods.some((method) => method.userId === userId)) {
        snapshot.paymentMethods.push({
          id: createId('payment-method'),
          isDemo: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          userId,
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2030,
          isDefault: true,
        })
      }
      snapshot.notifications.push(createNotification(userId, 'subscription_activated', subscription.id))
      return subscription
    })
  }

  async markPastDue(userId: string): Promise<Subscription> {
    return this.database.transaction((snapshot) => {
      const subscription = this.find(snapshot.subscriptions, userId)
      const graceEnd = new Date()
      graceEnd.setUTCDate(graceEnd.getUTCDate() + saasConfig.gracePeriodDays)
      subscription.status = 'past_due'
      subscription.gracePeriodEndsAt = graceEnd.toISOString()
      subscription.updatedAt = nowIso()
      snapshot.notifications.push(createNotification(userId, 'subscription_payment_issue', subscription.id))
      return subscription
    })
  }

  async sync(subscription: Subscription): Promise<Subscription> {
    return this.database.transaction((snapshot) => {
      const index = snapshot.subscriptions.findIndex((item) => item.userId === subscription.userId)
      if (index >= 0) snapshot.subscriptions[index] = clone(subscription)
      else snapshot.subscriptions.push(clone(subscription))
      return subscription
    })
  }

  async can(userId: string, role: UserRole, capability: SubscriptionCapability): Promise<boolean> {
    return canUseSubscriptionCapability(role, await this.getByUserId(userId), capability)
  }

  private update(userId: string, change: (subscription: Subscription) => void): Subscription {
    return this.database.transaction((snapshot) => {
      const subscription = this.find(snapshot.subscriptions, userId)
      change(subscription)
      subscription.updatedAt = nowIso()
      return subscription
    })
  }

  private find(subscriptions: Subscription[], userId: string): Subscription {
    const subscription = subscriptions.find((item) => item.userId === userId)
    if (!subscription) throw new DomainError('subscription_not_found')
    return subscription
  }
}
