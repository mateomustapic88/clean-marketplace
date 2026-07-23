import { StripeBillingService } from '~/server/services/StripeBillingService'
import { requireBillingUser } from '~/server/utils/billingSession'

export default defineEventHandler(async (event) => {
  const user = requireBillingUser(event)
  return new StripeBillingService().state(
    user.id,
    user.role as 'owner' | 'cleaner',
  )
})
