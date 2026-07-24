export type FeedbackType = 'bug' | 'improvement' | 'support'

export interface FeedbackInput {
  type: FeedbackType
  name: string
  email: string
  subject: string
  message: string
}

export interface FeedbackRecord extends FeedbackInput {
  id: string
  userId: string | null
  status: 'new' | 'reviewing' | 'resolved' | 'closed'
  createdAt: string
}
