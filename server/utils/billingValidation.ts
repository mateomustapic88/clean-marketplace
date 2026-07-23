import { z } from 'zod'

export const relativePathSchema = z.string()
  .startsWith('/')
  .max(500)
  .refine((path) => !path.startsWith('//'), 'Absolute URLs are not allowed')

export const parseBody = async <TSchema extends z.ZodType>(
  event: Parameters<typeof readValidatedBody>[0],
  schema: TSchema,
): Promise<z.output<TSchema>> => readValidatedBody(event, (body) => schema.parse(body))
