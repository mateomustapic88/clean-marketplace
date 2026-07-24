import { StripeBillingService } from '~/server/services/StripeBillingService'
import { requireSupabaseUser } from '~/server/utils/supabaseAuth'
import { enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'billing-state', 60)
  const user = await requireSupabaseUser(event)
  return new StripeBillingService().state(
    user.id,
    user.role as 'owner' | 'cleaner',
  )
})
