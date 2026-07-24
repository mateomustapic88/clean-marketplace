import type {
  Subscription,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'

export type BillingRole = 'owner' | 'cleaner'
export type BillingDisplayStatus = SubscriptionStatus | 'not_subscribed'

export interface PublicBillingPlan {
  monthlyAmount: number
  currency: 'EUR'
  trialDays: number
}

export interface BillingPresentation {
  role: BillingRole
  monthlyAmount: number
  currency: 'EUR'
  includedTrialDays: number
  status: BillingDisplayStatus
  hasProviderSubscription: boolean
}

export type BillingCheckoutAction
  = | 'startTrial'
    | 'completeTrialSetup'
    | 'checkout'

export const getBillingCheckoutAction = (
  subscription: Subscription | null,
): BillingCheckoutAction | null => {
  if (subscription?.stripeSubscriptionId) return null
  if (subscription?.status === 'trial') return 'completeTrialSetup'
  if (!subscription) return 'startTrial'
  return 'checkout'
}

export const createBillingPresentation = (
  role: BillingRole,
  subscription: Subscription | null,
  plan: PublicBillingPlan,
): BillingPresentation => ({
  role,
  monthlyAmount: plan.monthlyAmount,
  currency: plan.currency,
  includedTrialDays: plan.trialDays,
  status: subscription?.status ?? 'not_subscribed',
  hasProviderSubscription: Boolean(subscription?.stripeSubscriptionId),
})
