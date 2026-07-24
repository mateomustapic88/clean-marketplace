import type { RepositoryRegistry } from '~/repositories'
import type { StripeGateway } from '~/services/billing/StripeGateway'
import type { AnalyticsProvider } from '~/domains/analytics/types'
import type { UploadService } from '~/services/uploads/UploadService'

declare module '#app' {
  interface NuxtApp {
    $analytics: AnalyticsProvider
    $repositories: RepositoryRegistry
    $stripe: StripeGateway
    $uploads: UploadService
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $analytics: AnalyticsProvider
    $repositories: RepositoryRegistry
    $stripe: StripeGateway
    $uploads: UploadService
  }
}

export {}
