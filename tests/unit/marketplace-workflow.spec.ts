import { beforeEach, describe, expect, it } from 'vitest'
import type { CreateCleaningJobInput } from '~/domains/jobs/types'
import type { CreateOfferInput } from '~/domains/offers/types'
import { MockDatabase } from '~/repositories/mock/MockDatabase'
import { MockJobRepository } from '~/repositories/mock/MockJobRepository'
import { MockOfferRepository } from '~/repositories/mock/MockOfferRepository'
import { MockUserRepository } from '~/repositories/mock/MockUserRepository'
import { normalizeCleanerProfile } from '~/utils/cleaner'

const database = new MockDatabase()
const jobs = new MockJobRepository(database)
const offers = new MockOfferRepository(database)
const users = new MockUserRepository(database)

const jobInput = (): CreateCleaningJobInput => ({
  ownerId: 'owner-user-01',
  assignedCleanerId: null,
  acceptedOfferId: null,
  title: 'Čišćenje apartmana za test',
  apartmentName: 'Apartman Mare',
  cityCode: 'zagreb',
  approximateArea: 'Trešnjevka',
  address: 'Demo ulica 14',
  hideExactAddress: true,
  sizeSquareMeters: 62,
  bedrooms: 2,
  bathrooms: 1,
  beds: 3,
  guestCapacity: 4,
  estimatedDurationHours: 3,
  preferredDate: '2026-09-20',
  preferredStartTime: '10:00',
  flexibleTime: true,
  proposedBudget: 90,
  budgetType: 'fixed',
  services: {
    cleaningSuppliesProvided: true,
    linenReplacement: true,
    towelReplacement: true,
    laundry: false,
    balconyCleaning: false,
    fridgeCleaning: false,
    ovenCleaning: false,
    kitchenCleaning: true,
    windowCleaning: false,
    sameDayTurnover: false,
  },
  additionalInstructions: 'Molim javiti vrijeme dolaska.',
  photoUrls: [],
  offerDeadline: '2026-09-19T18:00:00.000Z',
  status: 'draft',
  isUrgent: false,
})

const offerInput = (jobId: string, cleanerId = 'cleaner-user-01'): CreateOfferInput => ({
  jobId,
  cleanerId,
  proposedPrice: 82,
  priceType: 'fixed',
  estimatedDurationHours: 3,
  availableArrivalTime: '09:30',
  message: 'Mogu doći na vrijeme i donijeti potrebna sredstva.',
  suppliesIncluded: true,
  expiresAt: '2026-09-19T12:00:00.000Z',
})

const publishedJob = async () => {
  const draft = await jobs.create(jobInput())
  return jobs.update({ id: draft.id, status: 'published' })
}

describe('marketplace workflow', () => {
  beforeEach(() => database.reset())

  it('creates one demo offer and prevents a duplicate application', async () => {
    const job = await publishedJob()
    const offer = await offers.create(offerInput(job.id))

    expect(offer.status).toBe('pending')
    expect(offer.isDemo).toBe(true)
    await expect(offers.create(offerInput(job.id))).rejects.toMatchObject({
      code: 'active_offer_exists',
    })
  })

  it('edits a pending offer while preserving its identity', async () => {
    const job = await publishedJob()
    const offer = await offers.create(offerInput(job.id))
    const updated = await offers.update({
      id: offer.id,
      proposedPrice: 76,
      message: 'Ažurirana demo ponuda s uključenim sredstvima.',
    }, offer.cleanerId)

    expect(updated.id).toBe(offer.id)
    expect(updated.proposedPrice).toBe(76)
    expect(updated.status).toBe('pending')
  })

  it('withdraws a pending offer and makes it read-only', async () => {
    const job = await publishedJob()
    const offer = await offers.create(offerInput(job.id))
    const withdrawn = await offers.withdraw(offer.id, offer.cleanerId)

    expect(withdrawn.status).toBe('withdrawn')
    await expect(offers.update({ id: offer.id, proposedPrice: 70 }, offer.cleanerId))
      .rejects.toMatchObject({ code: 'offer_not_editable' })
  })

  it('accepts only one offer, assigns the cleaner, and rejects competing offers', async () => {
    const job = await publishedJob()
    const selected = await offers.create(offerInput(job.id))
    const competing = await offers.create(offerInput(job.id, 'cleaner-user-02'))

    const accepted = await offers.accept(selected.id, job.ownerId)
    const updatedJob = await jobs.getById(job.id)
    const rejected = await offers.getById(competing.id)

    expect(accepted.status).toBe('accepted')
    expect(rejected?.status).toBe('rejected')
    expect(updatedJob).toMatchObject({
      status: 'assigned',
      assignedCleanerId: selected.cleanerId,
      acceptedOfferId: selected.id,
    })
  })

  it('allows an owner to reject a pending offer', async () => {
    const job = await publishedJob()
    const offer = await offers.create(offerInput(job.id))

    await expect(offers.reject(offer.id, job.ownerId))
      .resolves.toMatchObject({ status: 'rejected' })
  })

  it('persists favourite jobs on the cleaner profile', async () => {
    const job = await publishedJob()
    const stored = await users.getCleanerById('cleaner-user-01')
    expect(stored).not.toBeNull()

    const profile = normalizeCleanerProfile(stored!)
    profile.favouriteJobIds.push(job.id)
    await users.updateCleaner(profile)

    await expect(users.getCleanerById(profile.userId))
      .resolves.toMatchObject({ favouriteJobIds: [job.id] })
  })

  it('persists weekly availability and vacation mode', async () => {
    const stored = await users.getCleanerById('cleaner-user-01')
    const profile = normalizeCleanerProfile(stored!)
    profile.availability[0] = {
      weekday: 0,
      enabled: true,
      ranges: [{ start: '08:00', end: '12:00' }],
    }
    profile.vacationMode = true
    await users.updateCleaner(profile)

    const updated = await users.getCleanerById(profile.userId)
    expect(updated?.vacationMode).toBe(true)
    expect(updated?.availability[0]?.ranges[0]).toEqual({
      start: '08:00',
      end: '12:00',
    })
  })

  it('records the offer and accepted-job timeline in chronological order', async () => {
    const job = await publishedJob()
    const offer = await offers.create(offerInput(job.id))
    await offers.update({ id: offer.id, proposedPrice: 80 }, offer.cleanerId)
    await offers.accept(offer.id, job.ownerId)
    await jobs.progress(job.id, offer.cleanerId, 'cleaner_confirmed')
    await jobs.progress(job.id, offer.cleanerId, 'in_progress')
    await jobs.progress(job.id, offer.cleanerId, 'completed')

    const timeline = await jobs.listActivities(job.id)
    expect(timeline.map((activity) => activity.type)).toEqual(expect.arrayContaining([
      'offer_submitted',
      'offer_edited',
      'offer_accepted',
      'cleaner_confirmed',
      'started',
      'completed',
    ]))
    expect(timeline.every((activity, index) => index === 0 || activity.occurredAt >= timeline[index - 1]!.occurredAt)).toBe(true)
  })
})
