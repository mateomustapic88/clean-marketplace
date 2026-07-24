import { createClient } from '@supabase/supabase-js'
import { createServerClient, parseCookieHeader, type CookieMethodsServer } from '@supabase/ssr'
import {
  createError,
  getHeader,
  setCookie,
  setResponseHeader,
  type H3Event,
} from 'h3'

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

export const createSupabaseCookieAdapter = (event: H3Event): CookieMethodsServer => ({
  getAll: () => parseCookieHeader(getHeader(event, 'cookie') ?? ''),
  setAll: (cookies, headers) => {
    for (const cookie of cookies) setCookie(event, cookie.name, cookie.value, cookie.options)
    for (const [name, value] of Object.entries(headers)) setResponseHeader(event, name, value)
  },
})

export const createServerSupabaseClient = (event: H3Event) => {
  const { url, key } = publicConfiguration()
  return createServerClient(url, key, {
    cookies: createSupabaseCookieAdapter(event),
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
