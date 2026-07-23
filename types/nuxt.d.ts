import type { RepositoryRegistry } from '~/repositories'
import type { StripeGateway } from '~/services/billing/StripeGateway'

declare module '#app' {
  interface NuxtApp {
    $repositories: RepositoryRegistry
    $stripe: StripeGateway
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $repositories: RepositoryRegistry
    $stripe: StripeGateway
  }
}

export {}
