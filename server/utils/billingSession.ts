import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import type { User } from '~/domains/users/types'
import { useBillingDatabase } from '~/server/utils/billingDatabase'

const cookieName = 'clean_billing_session'
const maxAge = 7 * 24 * 60 * 60

const sessionSecret = (): string => {
  const config = useRuntimeConfig()
  if (config.authSessionSecret) return config.authSessionSecret
  if (config.stripeSecretKey) {
    return createHmac('sha256', config.stripeSecretKey)
      .update('clean-billing-session-v1')
      .digest('hex')
  }
  if (config.public.billingMode === 'mock') return 'local-mock-session-only'
  throw createError({
    statusCode: 503,
    statusMessage: 'Billing authentication is not configured',
  })
}

const signature = (payload: string): string =>
  createHmac('sha256', sessionSecret()).update(payload).digest('base64url')

const encode = (userId: string): string => {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Date.now() + maxAge * 1000,
  })).toString('base64url')
  return `${payload}.${signature(payload)}`
}

const decode = (token: string): { userId: string, expiresAt: number } | null => {
  const [payload, suppliedSignature] = token.split('.')
  if (!payload || !suppliedSignature) return null
  const expectedSignature = signature(payload)
  const supplied = Buffer.from(suppliedSignature)
  const expected = Buffer.from(expectedSignature)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      userId?: unknown
      expiresAt?: unknown
    }
    return typeof value.userId === 'string'
      && typeof value.expiresAt === 'number'
      && value.expiresAt > Date.now()
      ? { userId: value.userId, expiresAt: value.expiresAt }
      : null
  }
  catch {
    return null
  }
}

export const setBillingSession = (event: H3Event, userId: string): void => {
  setCookie(event, cookieName, encode(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })
}

export const clearBillingSession = (event: H3Event): void => {
  deleteCookie(event, cookieName, { path: '/' })
}

export const requireBillingUser = (event: H3Event): User => {
  const token = getCookie(event, cookieName)
  const session = token ? decode(token) : null
  const user = session
    ? useBillingDatabase().read().users.find((item) => item.id === session.userId)
    : null
  if (!user || user.role === 'admin') {
    clearBillingSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  return user
}
