import { StripeBillingService } from '~/server/services/StripeBillingService'
import { checkoutRequestSchema } from '~/server/schemas/billing'
import { parseBody } from '~/server/utils/billingValidation'
import { requireSupabaseUser } from '~/server/utils/supabaseAuth'
import { assertTrustedOrigin, enforceRateLimit } from '~/server/utils/requestSecurity'

export default defineEventHandler(async (event) => {
  assertTrustedOrigin(event)
  await enforceRateLimit(event, 'billing-checkout', 5, 10 * 60_000)
  const user = await requireSupabaseUser(event)
  const body = await parseBody(event, checkoutRequestSchema)
  const role = user.role as 'owner' | 'cleaner'
  if (body.role !== role) {
    throw createError({ statusCode: 403, statusMessage: 'The requested billing role is not allowed' })
  }
  const siteUrl = useRuntimeConfig().public.siteUrl
  const billingPath = role === 'owner' ? '/dashboard/billing' : '/dashboard-cleaner/billing'
  const successUrl = new URL(`${billingPath}?checkout=success`, siteUrl).toString()
  const cancelUrl = new URL(`${billingPath}?checkout=cancelled`, siteUrl).toString()
  const session = await new StripeBillingService().checkout(
    user.id,
    role,
    body.billingPeriod,
    user.email,
    successUrl,
    cancelUrl,
  )
  return { url: session.url }
})
