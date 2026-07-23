import { z } from 'zod'
import type { User } from '~/domains/users/types'
import { createId, nowIso } from '~/repositories/mock/helpers'
import { setBillingSession } from '~/server/utils/billingSession'
import { useBillingDatabase } from '~/server/utils/billingDatabase'
import { parseBody } from '~/server/utils/billingValidation'
import { MockSubscriptionRepository } from '~/repositories/mock/MockSubscriptionRepository'

const schema = z.object({
  userId: z.string().min(1).max(100),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
  role: z.enum(['owner', 'cleaner']),
})

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, schema)
  const database = useBillingDatabase()
  database.transaction((snapshot) => {
    const normalizedEmail = body.email.trim().toLowerCase()
    if (snapshot.users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
      throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
    }
    const timestamp = nowIso()
    const user: User = {
      id: body.userId,
      isDemo: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      email: normalizedEmail,
      displayName: `${body.firstName.trim()} ${body.lastName.trim()}`,
      role: body.role,
      status: 'active',
      avatarSeed: body.userId,
    }
    snapshot.users.push(user)
    snapshot.credentials.push({
      id: createId('credential'),
      isDemo: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: user.id,
      email: normalizedEmail,
      password: body.password,
    })
  })
  await new MockSubscriptionRepository(database).ensureTrial(body.userId, body.role)
  setBillingSession(event, body.userId)
  return { authenticated: true }
})
