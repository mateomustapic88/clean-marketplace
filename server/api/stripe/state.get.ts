import { StripeBillingService } from '~/server/services/StripeBillingService'
import { requireBillingUser } from '~/server/utils/billingSession'
import { enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'billing-state', 60)
  const user = requireBillingUser(event)
  return new StripeBillingService().state(
    user.id,
    user.role as 'owner' | 'cleaner',
  )
})
