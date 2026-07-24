import type {
  BillingPeriod,
  Subscription,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'

export type BillingRole = 'owner' | 'cleaner'
export type BillingDisplayStatus = SubscriptionStatus | 'not_subscribed'

export interface PublicBillingPlan {
  monthlyAmount: number
  annualAmount: number
  currency: 'EUR'
  trialDays: number
}

export interface BillingPresentation {
  role: BillingRole
  amount: number
  billingPeriod: BillingPeriod
  annualDiscountPercent: number
  currency: 'EUR'
  includedTrialDays: number
  status: BillingDisplayStatus
  hasProviderSubscription: boolean
}

export interface AnnualSavings {
  amount: number
  percent: number
}

export const calculateAnnualSavings = (
  plan: Pick<PublicBillingPlan, 'monthlyAmount' | 'annualAmount'>,
): AnnualSavings => {
  const monthlyTotal = plan.monthlyAmount * 12
  const amount = Math.max(0, monthlyTotal - plan.annualAmount)
  return {
    amount,
    percent: monthlyTotal > 0 ? Math.round(amount / monthlyTotal * 100) : 0,
  }
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
  selectedBillingPeriod: BillingPeriod,
): BillingPresentation => {
  const hasProviderSubscription = Boolean(subscription?.stripeSubscriptionId)
  const billingPeriod = hasProviderSubscription
    ? subscription!.billingPeriod
    : selectedBillingPeriod
  return {
    role,
    billingPeriod,
    amount: hasProviderSubscription
      ? subscription!.unitAmount
      : plan[billingPeriod === 'annual' ? 'annualAmount' : 'monthlyAmount'],
    annualDiscountPercent: calculateAnnualSavings(plan).percent,
    currency: plan.currency,
    includedTrialDays: plan.trialDays,
    status: subscription?.status ?? 'not_subscribed',
    hasProviderSubscription,
  }
}
