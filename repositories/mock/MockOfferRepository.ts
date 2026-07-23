import { DomainError } from '~/domains/shared/errors'
import type {
  CreateOfferInput,
  JobOffer,
  UpdateOfferInput,
} from '~/domains/offers/types'
import type { OfferRepository } from '~/repositories/offers/OfferRepository'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'
import { clone, createId, nowIso } from '~/repositories/mock/helpers'
import { createJobActivity } from '~/services/jobs/jobActivity'
import { canJobReceiveOffers } from '~/services/offers/offerRules'
import { createNotification } from '~/services/notifications/notificationFactory'
import { canUseSubscriptionCapability } from '~/services/subscriptions/subscriptionAccess'

export class MockOfferRepository implements OfferRepository {
  constructor(private readonly database: MockDatabase) {}

  async listByJob(jobId: string): Promise<JobOffer[]> {
    return clone(this.database.read().offers.filter((offer) => offer.jobId === jobId))
  }

  async listByCleaner(cleanerId: string): Promise<JobOffer[]> {
    return clone(
      this.database.read().offers.filter((offer) => offer.cleanerId === cleanerId),
    )
  }

  async getById(id: string): Promise<JobOffer | null> {
    return clone(this.database.read().offers.find((offer) => offer.id === id) ?? null)
  }

  async create(input: CreateOfferInput): Promise<JobOffer> {
    return this.database.transaction((snapshot) => {
      const job = snapshot.jobs.find((item) => item.id === input.jobId)
      if (!job || !canJobReceiveOffers(job)) {
        throw new DomainError('job_not_accepting_offers')
      }
      if (job.ownerId === input.cleanerId) {
        throw new DomainError('cannot_offer_own_job')
      }
      const subscription = snapshot.subscriptions.find((item) => item.userId === input.cleanerId) ?? null
      if (!canUseSubscriptionCapability('cleaner', subscription, 'submit_offers')) {
        throw new DomainError('subscription_required')
      }

      const duplicateOffer = snapshot.offers.some(
        (offer) => offer.jobId === input.jobId
          && offer.cleanerId === input.cleanerId,
      )
      if (duplicateOffer) {
        throw new DomainError('active_offer_exists')
      }

      const timestamp = nowIso()
      const offer: JobOffer = {
        ...clone(input),
        id: createId('offer'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'pending',
      }
      snapshot.offers.push(offer)
      job.offerCount += 1
      if (job.status === 'published') {
        job.status = 'receiving_offers'
      }
      job.updatedAt = timestamp
      snapshot.activities.push(createJobActivity(
        job.id,
        'offer_submitted',
        input.cleanerId,
        { offerId: offer.id },
        timestamp,
      ))
      snapshot.notifications.push(createNotification(job.ownerId, 'new_offer', job.id, {
        offerId: offer.id,
      }))

      return offer
    })
  }

  async update(input: UpdateOfferInput, cleanerId: string): Promise<JobOffer> {
    return this.database.transaction((snapshot) => {
      const index = snapshot.offers.findIndex((offer) => offer.id === input.id)
      const currentOffer = snapshot.offers[index]
      if (!currentOffer) {
        throw new DomainError('offer_not_found')
      }
      if (currentOffer.cleanerId !== cleanerId) {
        throw new DomainError('offer_not_found')
      }
      if (currentOffer.status !== 'pending') {
        throw new DomainError('offer_not_editable')
      }
      const subscription = snapshot.subscriptions.find((item) => item.userId === cleanerId) ?? null
      if (!canUseSubscriptionCapability('cleaner', subscription, 'submit_offers')) {
        throw new DomainError('subscription_required')
      }

      const updatedOffer: JobOffer = {
        ...currentOffer,
        ...clone(input),
        id: currentOffer.id,
        updatedAt: nowIso(),
      }
      snapshot.offers[index] = updatedOffer
      snapshot.activities.push(createJobActivity(
        updatedOffer.jobId,
        'offer_edited',
        cleanerId,
        { offerId: updatedOffer.id },
        updatedOffer.updatedAt,
      ))
      return updatedOffer
    })
  }

  async withdraw(id: string, cleanerId: string): Promise<JobOffer> {
    return this.database.transaction((snapshot) => {
      const offer = snapshot.offers.find((item) => item.id === id)
      if (!offer || offer.cleanerId !== cleanerId) {
        throw new DomainError('offer_not_found')
      }
      if (offer.status !== 'pending') {
        throw new DomainError('offer_not_withdrawable')
      }

      offer.status = 'withdrawn'
      offer.updatedAt = nowIso()
      snapshot.activities.push(createJobActivity(
        offer.jobId,
        'offer_withdrawn',
        cleanerId,
        { offerId: offer.id },
        offer.updatedAt,
      ))
      return offer
    })
  }

  async accept(id: string, ownerId: string): Promise<JobOffer> {
    return this.database.transaction((snapshot) => {
      const offer = snapshot.offers.find((item) => item.id === id)
      if (!offer || offer.status !== 'pending') {
        throw new DomainError('offer_not_acceptable')
      }

      const job = snapshot.jobs.find((item) => item.id === offer.jobId)
      if (!job || job.ownerId !== ownerId) {
        throw new DomainError('offer_not_acceptable')
      }
      if (!canJobReceiveOffers(job)) {
        throw new DomainError('offer_not_acceptable')
      }
      const ownerSubscription = snapshot.subscriptions.find((item) => item.userId === ownerId) ?? null
      if (!canUseSubscriptionCapability('owner', ownerSubscription, 'publish_jobs')) {
        throw new DomainError('subscription_required')
      }
      if (job.acceptedOfferId) {
        throw new DomainError('offer_already_accepted')
      }

      const timestamp = nowIso()
      snapshot.offers
        .filter((item) => item.jobId === job.id && item.status === 'pending')
        .forEach((item) => {
          item.status = item.id === offer.id ? 'accepted' : 'rejected'
          item.updatedAt = timestamp
          snapshot.activities.push(createJobActivity(
            job.id,
            item.id === offer.id ? 'offer_accepted' : 'offer_rejected',
            ownerId,
            { offerId: item.id, cleanerId: item.cleanerId },
            timestamp,
          ))
          snapshot.notifications.push(createNotification(
            item.cleanerId,
            item.id === offer.id ? 'offer_accepted' : 'offer_rejected',
            job.id,
            { offerId: item.id },
          ))
        })

      job.acceptedOfferId = offer.id
      job.assignedCleanerId = offer.cleanerId
      job.status = 'assigned'
      job.updatedAt = timestamp

      return offer
    })
  }

  async reject(id: string, ownerId: string): Promise<JobOffer> {
    return this.database.transaction((snapshot) => {
      const offer = snapshot.offers.find((item) => item.id === id)
      if (!offer || offer.status !== 'pending') {
        throw new DomainError('offer_not_rejectable')
      }
      const job = snapshot.jobs.find((item) => item.id === offer.jobId)
      if (!job || job.ownerId !== ownerId || job.acceptedOfferId) {
        throw new DomainError('offer_not_rejectable')
      }
      offer.status = 'rejected'
      offer.updatedAt = nowIso()
      snapshot.activities.push(createJobActivity(
        job.id,
        'offer_rejected',
        ownerId,
        { offerId: offer.id, cleanerId: offer.cleanerId },
        offer.updatedAt,
      ))
      return offer
    })
  }
}
