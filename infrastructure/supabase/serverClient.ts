import { createClient } from '@supabase/supabase-js'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { H3Event } from 'h3'

const publicConfiguration = () => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabasePublishableKey) {
    throw createError({ statusCode: 503, statusMessage: 'Production infrastructure is not configured' })
  }
  return {
    url: config.public.supabaseUrl,
    key: config.public.supabasePublishableKey,
  }
}

export const createServerSupabaseClient = (event: H3Event) => {
  const { url, key } = publicConfiguration()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => parseCookieHeader(getHeader(event, 'cookie') ?? ''),
      setAll: (cookies, headers) => {
        for (const cookie of cookies) setCookie(event, cookie.name, cookie.value, cookie.options)
        for (const [name, value] of Object.entries(headers)) setResponseHeader(event, name, value)
      },
    },
  })
}

export const createAdminSupabaseClient = () => {
  const config = useRuntimeConfig()
  if (!config.supabaseServiceRoleKey || !config.public.supabaseUrl) {
    throw createError({ statusCode: 503, statusMessage: 'Supabase server credentials are not configured' })
  }
  return createClient(config.public.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
