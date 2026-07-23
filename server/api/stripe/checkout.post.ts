import { StripeBillingService } from '~/server/services/StripeBillingService'
import { checkoutRequestSchema } from '~/server/schemas/billing'
import { parseBody } from '~/server/utils/billingValidation'
import { requireBillingUser } from '~/server/utils/billingSession'

export default defineEventHandler(async (event) => {
  const user = requireBillingUser(event)
  const body = await parseBody(event, checkoutRequestSchema)
  const role = user.role as 'owner' | 'cleaner'
  const siteUrl = useRuntimeConfig().public.siteUrl
  const successUrl = new URL(body.successPath, siteUrl).toString()
  const cancelUrl = new URL(body.cancelPath, siteUrl).toString()
  const session = await new StripeBillingService().checkout(
    user.id,
    role,
    user.email,
    successUrl,
    cancelUrl,
  )
  return { url: session.url }
})
