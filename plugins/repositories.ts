import { createMockRepositories } from '~/repositories/mock/createMockRepositories'
import { MockStripeGateway } from '~/services/billing/MockStripeGateway'

export default defineNuxtPlugin(() => ({
  provide: {
    repositories: createMockRepositories(),
    stripe: new MockStripeGateway(),
  },
}))
