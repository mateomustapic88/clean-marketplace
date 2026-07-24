import type { FeedbackInput, FeedbackRecord } from '~/domains/feedback/types'
import type { FeedbackRepository } from '~/repositories/feedback/FeedbackRepository'
import { createId, nowIso } from '~/repositories/mock/helpers'

export class MockFeedbackRepository implements FeedbackRepository {
  async create(input: FeedbackInput): Promise<FeedbackRecord> {
    return { ...input, id: createId('feedback'), userId: null, status: 'new', createdAt: nowIso() }
  }
}
