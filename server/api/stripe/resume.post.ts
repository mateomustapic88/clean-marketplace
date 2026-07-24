import { defineEventHandler } from 'h3'
import { StripeBillingService } from '~/server/services/StripeBillingService'
import { requireSupabaseUser } from '~/server/utils/supabaseAuth'
import { assertTrustedOrigin, enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  assertTrustedOrigin(event)
  await enforceRateLimit(event, 'billing-resume', 5, 10 * 60_000)
  const user = await requireSupabaseUser(event)
  return new StripeBillingService().resume(user.id)
})
