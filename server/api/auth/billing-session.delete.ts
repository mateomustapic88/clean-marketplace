import { clearBillingSession } from '~/server/utils/billingSession'
import { assertTrustedOrigin, enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler((event) => {
  assertTrustedOrigin(event)
  enforceRateLimit(event, 'auth-logout', 20)
  clearBillingSession(event)
  return { authenticated: false }
})
