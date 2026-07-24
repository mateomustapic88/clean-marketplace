import { StripeBillingService } from '~/server/services/StripeBillingService'
import { requireBillingUser } from '~/server/utils/billingSession'
import { assertTrustedOrigin, enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  assertTrustedOrigin(event)
  enforceRateLimit(event, 'billing-resume', 5, 10 * 60_000)
  const user = requireBillingUser(event)
  return new StripeBillingService().resume(user.id)
})
