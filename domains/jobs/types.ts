import type { DemoEntity } from '~/domains/shared/types'

export type CleaningJobStatus
  = | 'draft'
    | 'published'
    | 'receiving_offers'
    | 'assigned'
    | 'cleaner_confirmed'
    | 'in_progress'
    | 'completed'
    | 'archived'
    | 'cancelled'

export type BudgetType = 'hourly' | 'fixed'

export interface CleaningJobServices {
  cleaningSuppliesProvided: boolean
  linenReplacement: boolean
  towelReplacement: boolean
  laundry: boolean
  balconyCleaning: boolean
  fridgeCleaning: boolean
  ovenCleaning: boolean
  kitchenCleaning: boolean
  windowCleaning: boolean
  sameDayTurnover: boolean
}

export type JobActivityType
  = | 'created'
    | 'draft_saved'
    | 'published'
    | 'viewed'
    | 'offer_received'
    | 'status_changed'
    | 'completed'
    | 'offer_submitted'
    | 'offer_edited'
    | 'offer_withdrawn'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'cleaner_confirmed'
    | 'started'

export interface JobActivity {
  id: string
  jobId: string
  actorUserId: string | null
  type: JobActivityType
  occurredAt: string
  metadata?: Record<string, string | number>
  isDemo: true
}

export interface CleaningJob extends DemoEntity {
  ownerId: string
  assignedCleanerId: string | null
  acceptedOfferId: string | null
  title: string
  apartmentName: string
  cityCode: string
  approximateArea: string
  address: string
  hideExactAddress: boolean
  sizeSquareMeters: number
  bedrooms: number
  bathrooms: number
  beds: number
  guestCapacity: number
  estimatedDurationHours: number
  preferredDate: string
  preferredStartTime: string
  flexibleTime: boolean
  proposedBudget: number
  budgetType: BudgetType
  services: CleaningJobServices
  additionalInstructions: string
  photoUrls: string[]
  offerDeadline: string
  status: CleaningJobStatus
  offerCount: number
  isUrgent: boolean
}

export interface JobFilters {
  search?: string
  cityCode?: string
  ownerId?: string
  cleanerId?: string
  status?: CleaningJobStatus
  budgetType?: BudgetType
  minimumBudget?: number
  maximumBudget?: number
  minimumSize?: number
  maximumSize?: number
  preferredDate?: string
  requiredServices?: Array<keyof CleaningJobServices>
  sameDayTurnover?: boolean
  weekendOnly?: boolean
}

export type CreateCleaningJobInput = Omit<
  CleaningJob,
  'id' | 'createdAt' | 'updatedAt' | 'isDemo' | 'offerCount'
>

export type UpdateCleaningJobInput = Partial<CreateCleaningJobInput> & {
  id: string
}

export type JobDraftInput = Omit<CreateCleaningJobInput, 'status'> & {
  status?: 'draft'
}
