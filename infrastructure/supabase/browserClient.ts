import { createBrowserClient } from '@supabase/ssr'

export const createAppBrowserSupabaseClient = () => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabasePublishableKey) {
    throw new Error('Supabase public configuration is missing')
  }
  return createBrowserClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey,
  )
}
