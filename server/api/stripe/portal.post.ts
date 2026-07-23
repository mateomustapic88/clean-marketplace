import { StripeBillingService } from '~/server/services/StripeBillingService'
import { portalRequestSchema } from '~/server/schemas/billing'
import { parseBody } from '~/server/utils/billingValidation'
import { requireBillingUser } from '~/server/utils/billingSession'

export default defineEventHandler(async (event) => {
  const user = requireBillingUser(event)
  const body = await parseBody(event, portalRequestSchema)
  const returnUrl = new URL(
    body.returnPath,
    useRuntimeConfig().public.siteUrl,
  ).toString()
  const session = await new StripeBillingService().portal(user.id, returnUrl)
  return { url: session.url }
})
