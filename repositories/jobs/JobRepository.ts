import type {
  CleaningJob,
  CreateCleaningJobInput,
  JobFilters,
  UpdateCleaningJobInput,
  JobActivity,
} from '~/domains/jobs/types'
import type { PublicJobSearch, SearchPage } from '~/domains/search/types'

export interface JobRepository {
  list(filters?: JobFilters): Promise<CleaningJob[]>
  searchPublic(criteria: PublicJobSearch): Promise<SearchPage<CleaningJob>>
  getById(id: string): Promise<CleaningJob | null>
  create(input: CreateCleaningJobInput): Promise<CleaningJob>
  update(input: UpdateCleaningJobInput): Promise<CleaningJob>
  duplicate(id: string, ownerId: string): Promise<CleaningJob>
  remove(id: string): Promise<void>
  listActivities(jobId: string): Promise<JobActivity[]>
  progress(
    id: string,
    cleanerId: string,
    status: Extract<CleaningJob['status'], 'cleaner_confirmed' | 'in_progress' | 'completed'>
  ): Promise<CleaningJob>
}
