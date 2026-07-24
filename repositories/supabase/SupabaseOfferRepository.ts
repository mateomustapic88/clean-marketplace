import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateOfferInput, JobOffer, UpdateOfferInput } from '~/domains/offers/types'
import type { OfferRepository } from '~/repositories/offers/OfferRepository'
import { throwIfSupabaseError } from './helpers'
import { mapOffer } from './mappers'
import type { DbRow } from './mappers'

const payload = (input: Partial<CreateOfferInput>) => ({
  ...(input.jobId !== undefined && { job_id: input.jobId }),
  ...(input.cleanerId !== undefined && { cleaner_id: input.cleanerId }),
  ...(input.proposedPrice !== undefined && { proposed_price_cents: Math.round(input.proposedPrice * 100) }),
  ...(input.priceType !== undefined && { price_type: input.priceType }),
  ...(input.estimatedDurationHours !== undefined && { estimated_duration_hours: input.estimatedDurationHours }),
  ...(input.availableArrivalTime !== undefined && { available_arrival_time: input.availableArrivalTime }),
  ...(input.message !== undefined && { message: input.message }),
  ...(input.suppliesIncluded !== undefined && { supplies_included: input.suppliesIncluded }),
  ...(input.expiresAt !== undefined && { expires_at: input.expiresAt }),
})

export class SupabaseOfferRepository implements OfferRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listByJob(jobId: string) { return this.list('job_id', jobId) }
  async listByCleaner(cleanerId: string) { return this.list('cleaner_id', cleanerId) }
  async getById(id: string): Promise<JobOffer | null> {
    const { data, error } = await this.client.from('offers').select('*').eq('id', id).maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapOffer(data as DbRow) : null
  }

  async create(input: CreateOfferInput): Promise<JobOffer> {
    const { data, error } = await this.client.from('offers').insert(payload(input)).select('*').single()
    throwIfSupabaseError(error)
    return mapOffer(data as DbRow)
  }

  async update(input: UpdateOfferInput, cleanerId: string): Promise<JobOffer> {
    const { id, ...changes } = input
    const { data, error } = await this.client.from('offers').update(payload(changes)).eq('id', id).eq('cleaner_id', cleanerId).select('*').single()
    throwIfSupabaseError(error)
    return mapOffer(data as DbRow)
  }

  async withdraw(id: string, cleanerId: string): Promise<JobOffer> {
    const { data, error } = await this.client.from('offers').update({ status: 'withdrawn' }).eq('id', id).eq('cleaner_id', cleanerId).select('*').single()
    throwIfSupabaseError(error)
    return mapOffer(data as DbRow)
  }

  async accept(id: string, _ownerId: string): Promise<JobOffer> {
    const offer = await this.getById(id)
    if (!offer) throw new Error('Offer not found')
    const { data, error } = await this.client.rpc('accept_offer', { target_job_id: offer.jobId, target_offer_id: id }).single()
    throwIfSupabaseError(error)
    return mapOffer(data as DbRow)
  }

  async reject(id: string, _ownerId: string): Promise<JobOffer> {
    const { data, error } = await this.client.rpc('reject_offer', { target_offer_id: id }).single()
    throwIfSupabaseError(error)
    return mapOffer(data as DbRow)
  }

  private async list(field: string, value: string): Promise<JobOffer[]> {
    const { data, error } = await this.client.from('offers').select('*').eq(field, value).order('created_at', { ascending: false })
    throwIfSupabaseError(error)
    return (data as DbRow[]).map(mapOffer)
  }
}
