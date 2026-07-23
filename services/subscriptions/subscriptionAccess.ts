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
): boolean => subscription
  ? ['trial', 'active'].includes(effectiveSubscriptionStatus(subscription, now))
  : false

export const canUseSubscriptionCapability = (
  role: UserRole,
  subscription: Subscription | null,
  capability: SubscriptionCapability,
  now = new Date(),
): boolean => {
  if (role === 'admin') return true
  if (role === 'owner' && capability !== 'publish_jobs') return false
  if (role === 'cleaner' && capability === 'publish_jobs') return false
  return hasActiveSubscription(subscription, now)
}

export const trialRemainingDays = (
  subscription: Subscription | null,
  now = new Date(),
): number => {
  if (!subscription?.trialEndsAt || effectiveSubscriptionStatus(subscription, now) !== 'trial') return 0
  return Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - now.getTime()) / 86_400_000))
}

export const createTrialDates = (now = new Date()) => {
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() + saasConfig.trialDays)
  return { startedAt: now.toISOString(), endsAt: end.toISOString() }
}
