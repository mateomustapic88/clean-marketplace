import type { ZodError } from 'zod'

export const getFieldErrors = (
  error: ZodError,
): Record<string, string> => error.issues.reduce<Record<string, string>>(
  (errors, issue) => {
    const field = issue.path.at(0)
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message
    }
    return errors
  },
  {},
)
