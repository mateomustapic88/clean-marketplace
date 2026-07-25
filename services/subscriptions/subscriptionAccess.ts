import { saasConfig } from '~/config/saas'
import type {
  Subscription,
  SubscriptionCapability,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'
import type { UserRole } from '~/domains/users/types'

export const effectiveSubscriptionStatus = (
  subscription: Subscription,
  now = new Date(),
): SubscriptionStatus => {
  if (
    subscription.status === 'trial'
    && (!subscription.trialEndsAt || new Date(subscription.trialEndsAt) <= now)
  ) {
    return 'expired'
  }
  if (
    subscription.status === 'past_due'
    && subscription.gracePeriodEndsAt
    && new Date(subscription.gracePeriodEndsAt) <= now
  ) {
    return 'suspended'
  }
  return subscription.status
}

export const hasActiveSubscription = (
  subscription: Subscription | null,
  now = new Date(),
  requireProviderSubscription = false,
): boolean => {
  if (!subscription) return false
  if (requireProviderSubscription && !subscription.stripeSubscriptionId?.trim()) return false
  const status = effectiveSubscriptionStatus(subscription, now)
  if (status === 'trial') return true
  if (status === 'active') {
    return !requireProviderSubscription || Boolean(
      subscription.currentPeriodEndsAt
      && new Date(subscription.currentPeriodEndsAt) > now,
    )
  }
  if (status === 'past_due') {
    return Boolean(
      subscription.gracePeriodEndsAt
      && new Date(subscription.gracePeriodEndsAt) > now,
    )
  }
  if (status === 'cancelled') {
    return Boolean(
      subscription.currentPeriodEndsAt
      && new Date(subscription.currentPeriodEndsAt) > now,
    )
  }
  return false
}

export const canUseSubscriptionCapability = (
  role: UserRole,
  subscription: Subscription | null,
  capability: SubscriptionCapability,
  now = new Date(),
  requireProviderSubscription = false,
): boolean => {
  if (role === 'admin') return true
  if (role === 'owner' && capability !== 'publish_jobs') return false
  if (role === 'cleaner' && capability === 'publish_jobs') return false
  return hasActiveSubscription(subscription, now, requireProviderSubscription)
}

export const trialRemainingDays = (
  subscription: Subscription | null,
  now = new Date(),
  requireProviderSubscription = false,
): number => {
  if (requireProviderSubscription && !subscription?.stripeSubscriptionId?.trim()) return 0
  if (!subscription?.trialEndsAt || effectiveSubscriptionStatus(subscription, now) !== 'trial') return 0
  return Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - now.getTime()) / 86_400_000))
}

export const createTrialDates = (now = new Date()) => {
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() + saasConfig.trialDays)
  return { startedAt: now.toISOString(), endsAt: end.toISOString() }
}
