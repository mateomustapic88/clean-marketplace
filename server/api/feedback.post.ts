import { z } from 'zod'
import { createAdminSupabaseClient, createServerSupabaseClient } from '~/infrastructure/supabase/serverClient'
import { assertTrustedOrigin, enforceRateLimit } from '~/server/utils/requestSecurity'

const schema = z.object({
  type: z.enum(['bug', 'improvement', 'support']),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
})

export default defineEventHandler(async (event) => {
  assertTrustedOrigin(event)
  await enforceRateLimit(event, 'feedback', 5, 15 * 60_000)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid feedback' })
  const userClient = createServerSupabaseClient(event)
  const { data: auth } = await userClient.auth.getUser()
  const { error } = await createAdminSupabaseClient().from('feedback').insert({
    ...parsed.data,
    user_id: auth.user?.id ?? null,
  })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Feedback could not be saved' })
  setResponseStatus(event, 201)
  return { saved: true }
})
