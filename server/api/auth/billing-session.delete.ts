import { clearBillingSession } from '~/server/utils/billingSession'

export default defineEventHandler((event) => {
  clearBillingSession(event)
  return { authenticated: false }
})
