import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from 'h3'
import { useRuntimeConfig } from '#imports'
import { z } from 'zod'
import { createAdminSupabaseClient, createServerSupabaseClient } from '~/infrastructure/supabase/serverClient'
import { sendContactEmail } from '~/server/utils/contactEmail'
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
  const config = useRuntimeConfig(event)
  if (!config.resendApiKey || !config.contactEmailFrom) {
    throw createError({ statusCode: 503, statusMessage: 'Contact email delivery is not configured' })
  }
  const userClient = createServerSupabaseClient(event)
  const { data: auth } = await userClient.auth.getUser()
  const { data: feedback, error } = await createAdminSupabaseClient().from('feedback').insert({
    ...parsed.data,
    user_id: auth.user?.id ?? null,
  }).select('id').single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Feedback could not be saved' })
  try {
    await sendContactEmail(parsed.data, {
      apiKey: config.resendApiKey,
      from: config.contactEmailFrom,
      to: config.contactEmailTo,
    }, `contact-feedback-${feedback.id}`)
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Contact email could not be delivered' })
  }
  setResponseStatus(event, 201)
  return { saved: true, delivered: true }
})
