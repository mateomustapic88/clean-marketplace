import type { StripeEventRepository } from '~/repositories/billing/StripeEventRepository'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'

const inFlightEvents = new Set<string>()

export class MockStripeEventRepository implements StripeEventRepository {
  constructor(private readonly database: MockDatabase) {}

  async isProcessed(eventId: string): Promise<boolean> {
    return this.database.read().processedStripeEventIds.includes(eventId)
  }

  async tryClaim(eventId: string): Promise<boolean> {
    if (inFlightEvents.has(eventId) || await this.isProcessed(eventId)) return false
    inFlightEvents.add(eventId)
    return true
  }

  async complete(eventId: string): Promise<void> {
    this.database.transaction((snapshot) => {
      if (!snapshot.processedStripeEventIds.includes(eventId)) {
        snapshot.processedStripeEventIds.push(eventId)
      }
    })
    inFlightEvents.delete(eventId)
  }

  async release(eventId: string): Promise<void> {
    inFlightEvents.delete(eventId)
  }
}
