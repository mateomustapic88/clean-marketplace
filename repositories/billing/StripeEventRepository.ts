export interface StripeEventRepository {
  isProcessed(eventId: string): Promise<boolean>
  tryClaim(eventId: string): Promise<boolean>
  complete(eventId: string): Promise<void>
  release(eventId: string): Promise<void>
}
