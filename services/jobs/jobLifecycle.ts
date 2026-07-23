import type {
  CleaningJob,
  CleaningJobStatus,
  CreateCleaningJobInput,
  JobActivity,
} from '~/domains/jobs/types'

export const jobStatusTransitions: Record<CleaningJobStatus, CleaningJobStatus[]> = {
  draft: ['published'],
  published: ['receiving_offers', 'cancelled', 'archived'],
  receiving_offers: ['assigned', 'cancelled', 'archived'],
  assigned: ['cleaner_confirmed', 'cancelled'],
  cleaner_confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['archived'],
  archived: ['published'],
  cancelled: ['published', 'archived'],
}

export const canTransitionJob = (
  from: CleaningJobStatus,
  to: CleaningJobStatus,
): boolean => from === to || jobStatusTransitions[from].includes(to)

export const isPublishedJobReadOnly = (status: CleaningJobStatus): boolean =>
  !['draft', 'archived', 'cancelled'].includes(status)

export const duplicateJobInput = (
  job: CleaningJob,
  now = new Date(),
): CreateCleaningJobInput => ({
  ...structuredClone(job),
  title: `${job.title} - kopija`,
  assignedCleanerId: null,
  acceptedOfferId: null,
  preferredDate: now.toISOString().slice(0, 10),
  offerDeadline: now.toISOString(),
  photoUrls: [...job.photoUrls],
  status: 'draft',
})

export const getOwnerJobStatistics = (jobs: CleaningJob[]) => ({
  active: jobs.filter((job) => ['published', 'receiving_offers', 'assigned', 'cleaner_confirmed', 'in_progress'].includes(job.status)).length,
  drafts: jobs.filter((job) => job.status === 'draft').length,
  completed: jobs.filter((job) => job.status === 'completed').length,
  offers: jobs.reduce((total, job) => total + job.offerCount, 0),
  averageCompletionHours: jobs.some((job) => job.status === 'completed') ? 3.4 : 0,
})

export const getProfileCompletion = (profile: {
  firstName: string
  lastName: string
  phone: string
  cityCode: string
  preferredLanguage?: string
  timeZone?: string
  apartmentName?: string | null
}): number => {
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.phone,
    profile.cityCode,
    profile.preferredLanguage,
    profile.timeZone,
    profile.apartmentName,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

export const buildJobTimeline = (job: CleaningJob): JobActivity[] => {
  const activities: JobActivity[] = [{
    id: `${job.id}-created`,
    jobId: job.id,
    actorUserId: job.ownerId,
    type: 'created',
    occurredAt: job.createdAt,
    isDemo: true,
  }]
  if (job.status === 'draft') {
    activities.push({
      id: `${job.id}-saved`,
      jobId: job.id,
      actorUserId: job.ownerId,
      type: 'draft_saved',
      occurredAt: job.updatedAt,
      isDemo: true,
    })
    return activities
  }
  activities.push({
    id: `${job.id}-published`,
    jobId: job.id,
    actorUserId: job.ownerId,
    type: 'published',
    occurredAt: job.updatedAt,
    isDemo: true,
  })
  if (job.offerCount > 0) {
    activities.push({
      id: `${job.id}-viewed`,
      jobId: job.id,
      actorUserId: null,
      type: 'viewed',
      occurredAt: job.updatedAt,
      isDemo: true,
    }, {
      id: `${job.id}-offer`,
      jobId: job.id,
      actorUserId: null,
      type: 'offer_received',
      occurredAt: job.updatedAt,
      metadata: { count: job.offerCount },
      isDemo: true,
    })
  }
  if (job.status === 'completed') {
    activities.push({
      id: `${job.id}-completed`,
      jobId: job.id,
      actorUserId: job.assignedCleanerId,
      type: 'completed',
      occurredAt: job.updatedAt,
      isDemo: true,
    })
  }
  return activities
}
