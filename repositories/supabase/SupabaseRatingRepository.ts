import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateRatingInput, Rating, RatingSummary, UpdateRatingInput } from '~/domains/ratings/types'
import type { RatingRepository } from '~/repositories/ratings/RatingRepository'
import { throwIfSupabaseError } from './helpers'
import { mapRating } from './mappers'
import type { DbRow } from './mappers'

const selection = '*, review_category_scores(*)'

export class SupabaseRatingRepository implements RatingRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listByUser(userId: string) { return this.list('reviewee_id', userId) }
  async listByJob(jobId: string) { return this.list('job_id', jobId) }
  async getById(id: string): Promise<Rating | null> {
    const { data, error } = await this.client.from('reviews').select(selection).eq('id', id).maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapRating(data as DbRow) : null
  }

  async create(input: CreateRatingInput): Promise<Rating> {
    const { data, error } = await this.client.rpc('create_review', {
      target_job_id: input.jobId, target_reviewee_id: input.subjectId,
      target_score: input.overallScore, target_comment: input.comment,
      target_scores: input.categoryScores,
    }).single()
    throwIfSupabaseError(error)
    const created = data as { id: string } | null
    if (!created) throw new Error('Review was not returned after creation')
    return (await this.getById(created.id))!
  }

  async update(input: UpdateRatingInput, authorId: string): Promise<Rating> {
    const { error } = await this.client.from('reviews').update({
      overall_score: input.overallScore, comment: input.comment,
    }).eq('id', input.id).eq('reviewer_id', authorId)
    throwIfSupabaseError(error)
    const { error: scoreError } = await this.client.from('review_category_scores').upsert(
      input.categoryScores.map((score) => ({ review_id: input.id, category: score.category, score: score.score })),
    )
    throwIfSupabaseError(scoreError)
    return (await this.getById(input.id))!
  }

  async summaryForUser(userId: string): Promise<RatingSummary> {
    const ratings = await this.listByUser(userId)
    const distribution: RatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const categoryTotals = new Map<string, number[]>()
    for (const rating of ratings) {
      const rounded = Math.max(1, Math.min(5, Math.round(rating.overallScore))) as keyof typeof distribution
      distribution[rounded]++
      for (const item of rating.categoryScores) categoryTotals.set(item.category, [...(categoryTotals.get(item.category) ?? []), item.score])
    }
    return {
      average: ratings.length ? ratings.reduce((sum, item) => sum + item.overallScore, 0) / ratings.length : null,
      count: ratings.length, distribution,
      categoryAverages: Object.fromEntries([...categoryTotals].map(([key, values]) => [key, values.reduce((a, b) => a + b, 0) / values.length])),
    }
  }

  private async list(field: string, value: string): Promise<Rating[]> {
    const { data, error } = await this.client.from('reviews').select(selection).eq(field, value).order('created_at', { ascending: false })
    throwIfSupabaseError(error)
    return (data as DbRow[]).map(mapRating)
  }
}
