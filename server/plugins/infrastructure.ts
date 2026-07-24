import { productionCanonicalUrl } from '~/config/infrastructure'

export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return
  if (!process.env.APP_BASE_URL) {
    throw new Error('APP_BASE_URL is required in production')
  }
  if (useRuntimeConfig().public.siteUrl !== productionCanonicalUrl) {
    throw new Error(`Production APP_BASE_URL must be ${productionCanonicalUrl}`)
  }
  if (
    useRuntimeConfig().public.infrastructureMode !== 'supabase'
    || !useRuntimeConfig().public.supabaseUrl
    || !useRuntimeConfig().public.supabasePublishableKey
    || !useRuntimeConfig().supabaseServiceRoleKey
  ) {
    throw new Error('Complete Supabase configuration is required in production')
  }
  if (useRuntimeConfig().public.billingMode !== 'stripe') {
    throw new Error('Stripe billing mode is required in production')
  }
})
