import type { SupabaseClient } from '@supabase/supabase-js'
import type { StripeEventRepository } from '~/repositories/billing/StripeEventRepository'

const STALE_EVENT_CLAIM_MS = 15 * 60_000

export class SupabaseStripeEventRepository implements StripeEventRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly eventType: string,
    private readonly eventCreatedAt: string,
  ) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const { data, error } = await this.client.from('stripe_events')
      .select('status').eq('stripe_event_id', eventId).maybeSingle()
    if (error) throw new Error(error.message)
    return data?.status === 'processed'
  }

  async tryClaim(eventId: string): Promise<boolean> {
    const { error } = await this.client.from('stripe_events').insert({
      stripe_event_id: eventId,
      event_type: this.eventType,
      event_created_at: this.eventCreatedAt,
      status: 'processing',
    })
    if (!error) return true
    if (error.code === '23505') {
      const staleBefore = new Date(Date.now() - STALE_EVENT_CLAIM_MS).toISOString()
      const { data, error: reclaimError } = await this.client.from('stripe_events').update({
        event_type: this.eventType,
        event_created_at: this.eventCreatedAt,
        claimed_at: new Date().toISOString(),
        processing_result: null,
      })
        .eq('stripe_event_id', eventId)
        .eq('status', 'processing')
        .lt('claimed_at', staleBefore)
        .select('stripe_event_id')
        .maybeSingle()
      if (reclaimError) throw new Error(reclaimError.message)
      return Boolean(data)
    }
    throw new Error(error.message)
  }

  async complete(eventId: string): Promise<void> {
    const { error } = await this.client.from('stripe_events').update({
      status: 'processed', processed_at: new Date().toISOString(), processing_result: 'ok',
    }).eq('stripe_event_id', eventId)
    if (error) throw new Error(error.message)
  }

  async release(eventId: string): Promise<void> {
    const { error } = await this.client.from('stripe_events').delete().eq('stripe_event_id', eventId).eq('status', 'processing')
    if (error) throw new Error(error.message)
  }
}
