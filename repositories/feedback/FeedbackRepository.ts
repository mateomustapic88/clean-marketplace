import type { FeedbackInput, FeedbackRecord } from '~/domains/feedback/types'

export interface FeedbackRepository {
  create(input: FeedbackInput): Promise<FeedbackRecord>
}
