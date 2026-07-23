import { StripeBillingService } from '~/server/services/StripeBillingService'
import { requireBillingUser } from '~/server/utils/billingSession'

export default defineEventHandler(async (event) => {
  const user = requireBillingUser(event)
  return new StripeBillingService().cancel(user.id)
})
