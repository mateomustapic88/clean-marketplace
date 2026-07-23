import type {
  CreateOfferInput,
  JobOffer,
  UpdateOfferInput,
} from '~/domains/offers/types'

export interface OfferRepository {
  listByJob(jobId: string): Promise<JobOffer[]>
  listByCleaner(cleanerId: string): Promise<JobOffer[]>
  getById(id: string): Promise<JobOffer | null>
  create(input: CreateOfferInput): Promise<JobOffer>
  update(input: UpdateOfferInput, cleanerId: string): Promise<JobOffer>
  withdraw(id: string, cleanerId: string): Promise<JobOffer>
  accept(id: string, ownerId: string): Promise<JobOffer>
  reject(id: string, ownerId: string): Promise<JobOffer>
}
