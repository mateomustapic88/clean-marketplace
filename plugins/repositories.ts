import { createAppBrowserSupabaseClient } from '~/infrastructure/supabase/browserClient'
import { createServerSupabaseClient } from '~/infrastructure/supabase/serverClient'
import type { RepositoryRegistry } from '~/repositories'
import { createSupabaseRepositories } from '~/repositories/supabase/createSupabaseRepositories'
import { MockStripeGateway } from '~/services/billing/MockStripeGateway'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  let repositories: RepositoryRegistry
  if (config.public.infrastructureMode === 'mock') {
    if (!import.meta.dev) throw new Error('Mock repositories are disabled in production builds')
    const { createMockRepositories } = await import('~/repositories/mock/createMockRepositories')
    repositories = createMockRepositories()
  }
  else {
    const client = import.meta.client
      ? createAppBrowserSupabaseClient()
      : createServerSupabaseClient(useRequestEvent()!)
    repositories = createSupabaseRepositories(client, config.public.siteUrl)
  }
  return {
    provide: {
      repositories,
      stripe: new MockStripeGateway(),
    },
  }
})
