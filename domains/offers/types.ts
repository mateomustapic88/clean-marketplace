import type { DemoEntity } from '~/domains/shared/types'
import type { BudgetType } from '~/domains/jobs/types'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired'

export interface JobOffer extends DemoEntity {
  jobId: string
  cleanerId: string
  proposedPrice: number
  priceType: BudgetType
  estimatedDurationHours: number
  availableArrivalTime: string
  message: string
  suppliesIncluded: boolean
  expiresAt: string
  status: OfferStatus
}

export type CreateOfferInput = Omit<
  JobOffer,
  'id' | 'createdAt' | 'updatedAt' | 'isDemo' | 'status'
>

export type UpdateOfferInput = Partial<CreateOfferInput> & {
  id: string
}
