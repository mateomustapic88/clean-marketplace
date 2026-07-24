import { StripeBillingService } from '~/server/services/StripeBillingService'
import { portalRequestSchema } from '~/server/schemas/billing'
import { parseBody } from '~/server/utils/billingValidation'
import { requireSupabaseUser } from '~/server/utils/supabaseAuth'
import { assertTrustedOrigin, enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  assertTrustedOrigin(event)
  await enforceRateLimit(event, 'billing-portal', 10, 10 * 60_000)
  const user = await requireSupabaseUser(event)
  const body = await parseBody(event, portalRequestSchema)
  const returnUrl = new URL(
    body.returnPath,
    useRuntimeConfig().public.siteUrl,
  ).toString()
  const session = await new StripeBillingService().portal(user.id, returnUrl)
  return { url: session.url }
})
