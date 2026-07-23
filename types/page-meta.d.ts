import type { UserRole } from '~/domains/users/types'
import type { SubscriptionCapability } from '~/domains/subscriptions/types'

declare module '#app' {
  interface PageMeta {
    roles?: UserRole[]
    subscriptionCapability?: SubscriptionCapability
  }
}

export {}
