import { z } from 'zod'
import { relativePathSchema } from '~/server/utils/billingValidation'

export const checkoutRequestSchema = z.object({
  role: z.enum(['owner', 'cleaner']),
  billingPeriod: z.enum(['monthly', 'annual']),
}).strict()

export const portalRequestSchema = z.object({
  returnPath: relativePathSchema,
}).strict()
