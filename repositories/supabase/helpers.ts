import type { PostgrestError } from '@supabase/supabase-js'
import { DomainError } from '~/domains/shared/errors'

export const throwIfSupabaseError = (error: PostgrestError | null): void => {
  if (!error) return
  if (error.code === '42501') throw new DomainError('forbidden', error.message)
  if (error.code === '23505') throw new DomainError('conflict', error.message)
  if (error.code === 'PGRST116') throw new DomainError('not_found', error.message)
  throw new DomainError('repository_error', error.message)
}
