import type { RepositoryRegistry } from '~/repositories'
import type { StripeGateway } from '~/services/billing/StripeGateway'
import type { AnalyticsProvider } from '~/domains/analytics/types'

declare module '#app' {
  interface NuxtApp {
    $analytics: AnalyticsProvider
    $repositories: RepositoryRegistry
    $stripe: StripeGateway
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $analytics: AnalyticsProvider
    $repositories: RepositoryRegistry
    $stripe: StripeGateway
  }
}

export {}
