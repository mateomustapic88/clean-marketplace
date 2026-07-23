import { z } from 'zod'
import { DomainError } from '~/domains/shared/errors'
import { setBillingSession } from '~/server/utils/billingSession'
import { useBillingDatabase } from '~/server/utils/billingDatabase'
import { parseBody } from '~/server/utils/billingValidation'

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, schema)
  const snapshot = useBillingDatabase().read()
  const credential = snapshot.credentials.find((item) =>
    item.email.toLowerCase() === body.email.trim().toLowerCase()
    && item.password === body.password,
  )
  const user = credential
    ? snapshot.users.find((item) => item.id === credential.userId)
    : null
  if (!user || user.status !== 'active') {
    throw new DomainError('invalid_credentials')
  }
  setBillingSession(event, user.id)
  return { authenticated: true }
})
