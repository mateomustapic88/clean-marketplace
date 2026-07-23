import { DomainError } from '~/domains/shared/errors'
import type {
  CleaningJob,
  CreateCleaningJobInput,
  JobFilters,
  JobActivity,
  UpdateCleaningJobInput,
} from '~/domains/jobs/types'
import type { JobRepository } from '~/repositories/jobs/JobRepository'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'
import { clone, createId, nowIso } from '~/repositories/mock/helpers'
import { canTransitionJob, duplicateJobInput } from '~/services/jobs/jobLifecycle'
import { createJobActivity } from '~/services/jobs/jobActivity'
import { createNotification } from '~/services/notifications/notificationFactory'
import { canUseSubscriptionCapability } from '~/services/subscriptions/subscriptionAccess'

export class MockJobRepository implements JobRepository {
  constructor(private readonly database: MockDatabase) {}

  async list(filters: JobFilters = {}): Promise<CleaningJob[]> {
    const jobs = this.database.read().jobs.filter((job) => {
      if (filters.cityCode && job.cityCode !== filters.cityCode) return false
      if (filters.ownerId && job.ownerId !== filters.ownerId) return false
      if (filters.cleanerId && job.assignedCleanerId !== filters.cleanerId) return false
      if (filters.status && job.status !== filters.status) return false
      if (filters.budgetType && job.budgetType !== filters.budgetType) return false
      if (filters.minimumBudget && job.proposedBudget < filters.minimumBudget) return false
      if (filters.maximumBudget && job.proposedBudget > filters.maximumBudget) return false
      if (filters.minimumSize && job.sizeSquareMeters < filters.minimumSize) return false
      if (filters.maximumSize && job.sizeSquareMeters > filters.maximumSize) return false
      if (filters.preferredDate && job.preferredDate !== filters.preferredDate) return false
      if (filters.sameDayTurnover && !job.services.sameDayTurnover) return false
      if (filters.weekendOnly) {
        const weekday = new Date(`${job.preferredDate}T12:00:00`).getDay()
        if (weekday !== 0 && weekday !== 6) return false
      }
      if (filters.requiredServices?.some((service) => !job.services[service])) return false
      return true
    })

    return clone(jobs)
  }

  async getById(id: string): Promise<CleaningJob | null> {
    return clone(this.database.read().jobs.find((job) => job.id === id) ?? null)
  }

  async create(input: CreateCleaningJobInput): Promise<CleaningJob> {
    return this.database.transaction((snapshot) => {
      if (!snapshot.users.some((user) => user.id === input.ownerId && user.role === 'owner')) {
        throw new DomainError('owner_not_found')
      }

      const timestamp = nowIso()
      const job: CleaningJob = {
        ...clone(input),
        id: createId('job'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        offerCount: 0,
      }
      snapshot.jobs.push(job)
      snapshot.activities.push(createJobActivity(job.id, 'created', job.ownerId, undefined, timestamp))
      return job
    })
  }

  async update(input: UpdateCleaningJobInput): Promise<CleaningJob> {
    return this.database.transaction((snapshot) => {
      const index = snapshot.jobs.findIndex((job) => job.id === input.id)
      if (index < 0) {
        throw new DomainError('job_not_found')
      }

      const currentJob = snapshot.jobs[index]
      if (!currentJob) {
        throw new DomainError('job_not_found')
      }

      if (
        input.status
        && input.status !== currentJob.status
        && !canTransitionJob(currentJob.status, input.status)
      ) {
        throw new DomainError('invalid_job_status_transition')
      }
      if (input.status === 'published') {
        const subscription = snapshot.subscriptions.find((item) => item.userId === currentJob.ownerId) ?? null
        if (!canUseSubscriptionCapability('owner', subscription, 'publish_jobs')) {
          throw new DomainError('subscription_required')
        }
      }

      const updatedJob: CleaningJob = {
        ...currentJob,
        ...clone(input),
        id: currentJob.id,
        updatedAt: nowIso(),
      }
      snapshot.jobs[index] = updatedJob
      if (input.status && input.status !== currentJob.status) {
        snapshot.activities.push(createJobActivity(
          updatedJob.id,
          input.status === 'completed' ? 'completed' : 'status_changed',
          updatedJob.ownerId,
          { from: currentJob.status, to: input.status },
          updatedJob.updatedAt,
        ))
        if (input.status === 'published') {
          snapshot.notifications.push(createNotification(updatedJob.ownerId, 'job_published', updatedJob.id))
        }
      }
      return updatedJob
    })
  }

  async duplicate(id: string, ownerId: string): Promise<CleaningJob> {
    const original = await this.getById(id)
    if (!original || original.ownerId !== ownerId) {
      throw new DomainError('job_not_found')
    }
    return this.create(duplicateJobInput(original))
  }

  async remove(id: string): Promise<void> {
    this.database.transaction((snapshot) => {
      const job = snapshot.jobs.find((item) => item.id === id)
      if (!job) {
        throw new DomainError('job_not_found')
      }
      if (job.status !== 'draft') {
        throw new DomainError('job_cannot_be_removed')
      }
      snapshot.jobs = snapshot.jobs.filter((item) => item.id !== id)
      snapshot.offers = snapshot.offers.filter((offer) => offer.jobId !== id)
      snapshot.activities = snapshot.activities.filter((activity) => activity.jobId !== id)
    })
  }

  async listActivities(jobId: string): Promise<JobActivity[]> {
    return clone(
      this.database.read().activities
        .filter((activity) => activity.jobId === jobId)
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    )
  }

  async progress(
    id: string,
    cleanerId: string,
    status: 'cleaner_confirmed' | 'in_progress' | 'completed',
  ): Promise<CleaningJob> {
    return this.database.transaction((snapshot) => {
      const job = snapshot.jobs.find((item) => item.id === id)
      if (!job || job.assignedCleanerId !== cleanerId) {
        throw new DomainError('job_not_found')
      }
      if (!canTransitionJob(job.status, status)) {
        throw new DomainError('invalid_job_status_transition')
      }
      if (status === 'cleaner_confirmed') {
        const subscription = snapshot.subscriptions.find((item) => item.userId === cleanerId) ?? null
        if (!canUseSubscriptionCapability('cleaner', subscription, 'submit_offers')) {
          throw new DomainError('subscription_required')
        }
      }
      const timestamp = nowIso()
      const previousStatus = job.status
      job.status = status
      job.updatedAt = timestamp
      snapshot.activities.push(createJobActivity(
        job.id,
        status === 'cleaner_confirmed'
          ? 'cleaner_confirmed'
          : status === 'in_progress'
            ? 'started'
            : 'completed',
        cleanerId,
        { from: previousStatus, to: status },
        timestamp,
      ))
      return job
    })
  }
}
