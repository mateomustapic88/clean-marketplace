import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CreateCleaningJobInput } from '~/domains/jobs/types'
import { MockDatabase } from '~/repositories/mock/MockDatabase'
import { MockJobRepository } from '~/repositories/mock/MockJobRepository'
import { createJobSchema } from '~/schemas/validation'
import { createAutosaveController } from '~/services/autosave/autosaveController'
import {
  canTransitionJob,
  duplicateJobInput,
} from '~/services/jobs/jobLifecycle'

const translate = (key: string) => key
const input = (): CreateCleaningJobInput => ({
  ownerId: 'owner-user-01',
  assignedCleanerId: null,
  acceptedOfferId: null,
  title: 'Demo skica',
  apartmentName: 'Apartman Luna',
  cityCode: 'zagreb',
  approximateArea: 'Centar',
  address: 'Primjer ulice 10',
  hideExactAddress: true,
  sizeSquareMeters: 55,
  bedrooms: 2,
  bathrooms: 1,
  beds: 3,
  guestCapacity: 4,
  estimatedDurationHours: 3,
  preferredDate: '2026-09-15',
  preferredStartTime: '10:00',
  flexibleTime: true,
  proposedBudget: 80,
  budgetType: 'fixed',
  services: {
    cleaningSuppliesProvided: true,
    linenReplacement: true,
    towelReplacement: true,
    laundry: false,
    balconyCleaning: false,
    kitchenCleaning: true,
    fridgeCleaning: false,
    ovenCleaning: false,
    windowCleaning: false,
    sameDayTurnover: false,
  },
  additionalInstructions: '',
  photoUrls: [],
  offerDeadline: '2026-09-14T18:00',
  status: 'draft',
  isUrgent: false,
})

describe('owner job lifecycle', () => {
  afterEach(() => vi.useRealTimers())

  it('saves and updates a draft through the repository', async () => {
    const database = new MockDatabase()
    database.reset()
    const repository = new MockJobRepository(database)
    const draft = await repository.create(input())
    const updated = await repository.update({ id: draft.id, title: 'Spremljena skica' })

    expect(draft.status).toBe('draft')
    expect(updated.title).toBe('Spremljena skica')
  })

  it('validates publish transitions and rejects invalid transitions', () => {
    expect(canTransitionJob('draft', 'published')).toBe(true)
    expect(canTransitionJob('published', 'archived')).toBe(true)
    expect(canTransitionJob('archived', 'published')).toBe(true)
    expect(canTransitionJob('completed', 'draft')).toBe(false)
  })

  it('publishes and archives a draft through repository validation', async () => {
    const database = new MockDatabase()
    database.reset()
    const repository = new MockJobRepository(database)
    const draft = await repository.create(input())
    const published = await repository.update({ id: draft.id, status: 'published' })
    const archived = await repository.update({ id: draft.id, status: 'archived' })

    expect(published.status).toBe('published')
    expect(archived.status).toBe('archived')
  })

  it('duplicates a previous job as an unassigned draft', () => {
    const original = {
      ...input(),
      id: 'job-test',
      offerCount: 5,
      isDemo: true,
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-02T10:00:00.000Z',
      status: 'completed' as const,
      assignedCleanerId: 'cleaner-user-01',
      acceptedOfferId: 'offer-01',
    }
    const duplicate = duplicateJobInput(original, new Date('2026-10-01T10:00:00.000Z'))

    expect(duplicate.status).toBe('draft')
    expect(duplicate.assignedCleanerId).toBeNull()
    expect(duplicate.acceptedOfferId).toBeNull()
    expect(duplicate.title).toContain('kopija')
  })

  it('prevents publishing when required wizard fields are missing', () => {
    const result = createJobSchema(translate).safeParse({
      ...input(),
      title: '',
    })
    expect(result.success).toBe(false)
  })

  it('autosaves dirty state on the configured interval', async () => {
    vi.useFakeTimers()
    const save = vi.fn(async () => Promise.resolve())
    const statuses: string[] = []
    const controller = createAutosaveController(save, (status) => statuses.push(status), 1000)

    controller.start()
    controller.markDirty()
    await vi.advanceTimersByTimeAsync(1000)
    controller.stop()

    expect(save).toHaveBeenCalledOnce()
    expect(statuses).toEqual(['unsaved', 'saving', 'saved'])
  })

  it('waits for an in-progress autosave before continuing', async () => {
    let completeSave: (() => void) | undefined
    const save = vi.fn(() => new Promise<void>((resolve) => {
      completeSave = resolve
    }))
    const controller = createAutosaveController(save, () => undefined)

    const intervalSave = controller.saveNow()
    const publishSave = controller.saveNow()
    expect(save).toHaveBeenCalledOnce()
    completeSave?.()

    await Promise.all([intervalSave, publishSave])
    expect(controller.status()).toBe('saved')
  })
})
