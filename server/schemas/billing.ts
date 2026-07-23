import { z } from 'zod'
import { relativePathSchema } from '~/server/utils/billingValidation'

export const checkoutRequestSchema = z.object({
  successPath: relativePathSchema,
  cancelPath: relativePathSchema,
}).strict()

export const portalRequestSchema = z.object({
  returnPath: relativePathSchema,
}).strict()
