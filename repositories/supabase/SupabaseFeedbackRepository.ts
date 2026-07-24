import type { SupabaseClient } from '@supabase/supabase-js'
import type { FeedbackInput, FeedbackRecord } from '~/domains/feedback/types'
import type { FeedbackRepository } from '~/repositories/feedback/FeedbackRepository'
import { throwIfSupabaseError } from './helpers'

export class SupabaseFeedbackRepository implements FeedbackRepository {
  constructor(private readonly client: SupabaseClient) {}
  async create(input: FeedbackInput): Promise<FeedbackRecord> {
    const { data: auth } = await this.client.auth.getUser()
    if (!auth.user) throw new Error('Anonymous feedback must use the protected server endpoint')
    const { data, error } = await this.client.from('feedback').insert({
      user_id: auth.user.id, type: input.type, name: input.name, email: input.email,
      subject: input.subject, message: input.message,
    }).select('*').single()
    throwIfSupabaseError(error)
    return {
      id: data.id, userId: data.user_id, type: data.type, name: data.name,
      email: data.email, subject: data.subject, message: data.message,
      status: data.status, createdAt: data.created_at,
    }
  }
}
