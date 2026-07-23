import type { CleaningJob } from '~/domains/jobs/types'
import type { JobOffer } from '~/domains/offers/types'

export const canJobReceiveOffers = (job: CleaningJob): boolean =>
  ['published', 'receiving_offers'].includes(job.status)

export const canEditOffer = (offer: JobOffer): boolean =>
  offer.status === 'pending'

export const hasSubmittedOffer = (
  offers: JobOffer[],
  jobId: string,
  cleanerId: string,
): boolean => offers.some(
  (offer) => offer.jobId === jobId && offer.cleanerId === cleanerId,
)

export const canSeeContactDetails = (
  job: CleaningJob,
  userId: string,
): boolean => Boolean(
  job.acceptedOfferId
  && (job.ownerId === userId || job.assignedCleanerId === userId),
)
