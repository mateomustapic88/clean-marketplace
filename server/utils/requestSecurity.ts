import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetsAt: number
}

const rateLimits = new Map<string, RateLimitEntry>()

const requestOrigin = (event: H3Event): string | null => {
  const origin = getHeader(event, 'origin')
  if (origin) return origin

  const referer = getHeader(event, 'referer')
  if (!referer) return null
  try {
    return new URL(referer).origin
  }
  catch {
    return null
  }
}

export const assertTrustedOrigin = (event: H3Event): void => {
  const origin = requestOrigin(event)
  if (!origin) {
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 403, statusMessage: 'Request origin is required' })
    }
    return
  }

  const allowedOrigins = new Set([
    new URL(useRuntimeConfig().public.siteUrl).origin,
    getRequestURL(event).origin,
  ])
  if (!allowedOrigins.has(origin)) {
    throw createError({ statusCode: 403, statusMessage: 'Request origin is not allowed' })
  }
}

export const enforceRateLimit = (
  event: H3Event,
  scope: string,
  limit = 10,
  windowMs = 60_000,
): void => {
  const now = Date.now()
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const key = `${scope}:${ip}`
  const current = rateLimits.get(key)

  if (!current || current.resetsAt <= now) {
    rateLimits.set(key, { count: 1, resetsAt: now + windowMs })
    return
  }

  if (current.count >= limit) {
    setResponseHeader(event, 'Retry-After', Math.ceil((current.resetsAt - now) / 1000))
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  current.count += 1
}
