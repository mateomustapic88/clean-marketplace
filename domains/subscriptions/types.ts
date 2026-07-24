import type { DemoEntity } from '~/domains/shared/types'

export type SubscriptionStatus
  = | 'trial'
    | 'active'
    | 'past_due'
    | 'cancelled'
    | 'expired'
    | 'suspended'
    | 'unpaid'
    | 'incomplete'
    | 'incomplete_expired'
    | 'paused'

export type BillingPeriod = 'monthly' | 'annual'
export type StripeBillingInterval = 'month' | 'year'

export interface Subscription extends DemoEntity {
  userId: string
  plan: 'owner' | 'cleaner'
  status: SubscriptionStatus
  unitAmount: number
  billingPeriod: BillingPeriod
  stripeInterval: StripeBillingInterval | null
  currency: 'EUR'
  trialStartedAt: string | null
  trialEndsAt: string | null
  trialConsumed: boolean
  currentPeriodStartedAt: string | null
  currentPeriodEndsAt: string | null
  cancelledAt: string | null
  cancelAtPeriodEnd: boolean
  gracePeriodEndsAt: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  lastSuccessfulPaymentAt: string | null
  lastFailedPaymentAt: string | null
}

export interface BillingInvoice extends DemoEntity {
  userId: string
  number: string
  amountPaid: number
  currency: 'EUR'
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  issuedAt: string
  hostedInvoiceUrl: string | null
}

export interface PaymentMethod extends DemoEntity {
  userId: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export type SubscriptionCapability = 'publish_jobs' | 'submit_offers' | 'view_contact'
