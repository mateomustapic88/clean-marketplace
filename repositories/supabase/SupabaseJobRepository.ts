import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CleaningJob, CreateCleaningJobInput, JobActivity, JobFilters, UpdateCleaningJobInput,
} from '~/domains/jobs/types'
import type { JobRepository } from '~/repositories/jobs/JobRepository'
import { throwIfSupabaseError } from './helpers'
import { mapActivity, mapJob } from './mappers'
import type { DbRow } from './mappers'

const selection = '*, job_services(*), job_private_locations(*), job_images(*)'

const jobPayload = (input: Partial<CreateCleaningJobInput>) => {
  const payload: Record<string, unknown> = {}
  const fields: Array<[keyof CreateCleaningJobInput, string, (value: never) => unknown]> = [
    ['ownerId', 'owner_id', (value) => value], ['assignedCleanerId', 'assigned_cleaner_id', (value) => value],
    ['acceptedOfferId', 'accepted_offer_id', (value) => value], ['title', 'title', (value) => value],
    ['apartmentName', 'apartment_name', (value) => value], ['cityCode', 'city_code', (value) => value],
    ['approximateArea', 'approximate_area', (value) => value], ['hideExactAddress', 'hide_exact_address', (value) => value],
    ['sizeSquareMeters', 'size_square_meters', (value) => value], ['bedrooms', 'bedrooms', (value) => value],
    ['bathrooms', 'bathrooms', (value) => value], ['beds', 'beds', (value) => value],
    ['guestCapacity', 'guest_capacity', (value) => value], ['estimatedDurationHours', 'estimated_duration_hours', (value) => value],
    ['preferredDate', 'preferred_date', (value) => value], ['preferredStartTime', 'preferred_start_time', (value) => value],
    ['flexibleTime', 'flexible_time', (value) => value], ['proposedBudget', 'proposed_budget_cents', (value) => Math.round(Number(value) * 100)],
    ['budgetType', 'budget_type', (value) => value], ['additionalInstructions', 'additional_instructions', (value) => value],
    ['offerDeadline', 'offer_deadline', (value) => value], ['status', 'status', (value) => value],
    ['isUrgent', 'is_urgent', (value) => value],
  ]
  for (const [domain, database, transform] of fields) {
    const value = input[domain]
    if (value !== undefined) payload[database] = transform(value as never)
  }
  return payload
}

const servicesPayload = (jobId: string, services: CreateCleaningJobInput['services']) => ({
  job_id: jobId, cleaning_supplies_provided: services.cleaningSuppliesProvided,
  linen_replacement: services.linenReplacement, towel_replacement: services.towelReplacement,
  laundry: services.laundry, balcony_cleaning: services.balconyCleaning,
  fridge_cleaning: services.fridgeCleaning, oven_cleaning: services.ovenCleaning,
  kitchen_cleaning: services.kitchenCleaning, window_cleaning: services.windowCleaning,
  same_day_turnover: services.sameDayTurnover,
})

export class SupabaseJobRepository implements JobRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(filters: JobFilters = {}): Promise<CleaningJob[]> {
    let query = this.client.from('jobs').select(selection).order('created_at', { ascending: false })
    if (filters.cityCode) query = query.eq('city_code', filters.cityCode)
    if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
    if (filters.cleanerId) query = query.eq('assigned_cleaner_id', filters.cleanerId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.budgetType) query = query.eq('budget_type', filters.budgetType)
    if (filters.preferredDate) query = query.eq('preferred_date', filters.preferredDate)
    if (filters.minimumBudget !== undefined) query = query.gte('proposed_budget_cents', Math.round(filters.minimumBudget * 100))
    if (filters.maximumBudget !== undefined) query = query.lte('proposed_budget_cents', Math.round(filters.maximumBudget * 100))
    if (filters.minimumSize !== undefined) query = query.gte('size_square_meters', filters.minimumSize)
    if (filters.maximumSize !== undefined) query = query.lte('size_square_meters', filters.maximumSize)
    const { data, error } = await query
    throwIfSupabaseError(error)
    return Promise.all((data as DbRow[]).map((record) => this.mapWithSignedImages(record)))
  }

  async getById(id: string): Promise<CleaningJob | null> {
    const { data, error } = await this.client.from('jobs').select(selection).eq('id', id).maybeSingle()
    throwIfSupabaseError(error)
    return data ? this.mapWithSignedImages(data as DbRow) : null
  }

  async create(input: CreateCleaningJobInput): Promise<CleaningJob> {
    const { data, error } = await this.client.from('jobs').insert(jobPayload(input)).select('id').single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('Job was not returned after creation')
    const jobId = data.id
    const [{ error: locationError }, { error: servicesError }] = await Promise.all([
      this.client.from('job_private_locations').insert({ job_id: jobId, exact_address: input.address }),
      this.client.from('job_services').insert(servicesPayload(jobId, input.services)),
    ])
    throwIfSupabaseError(locationError ?? servicesError)
    await this.finalizeImages(input.photoUrls, input.ownerId, jobId)
    return (await this.getById(jobId))!
  }

  async update(input: UpdateCleaningJobInput): Promise<CleaningJob> {
    const { error } = await this.client.from('jobs').update(jobPayload(input)).eq('id', input.id)
    throwIfSupabaseError(error)
    const updates = []
    if (input.address !== undefined) updates.push(this.client.from('job_private_locations').upsert({ job_id: input.id, exact_address: input.address }))
    if (input.services !== undefined) updates.push(this.client.from('job_services').upsert(servicesPayload(input.id, input.services)))
    const results = await Promise.all(updates)
    for (const result of results) throwIfSupabaseError(result.error)
    if (input.photoUrls) {
      const current = await this.getById(input.id)
      if (current) await this.finalizeImages(input.photoUrls, current.ownerId, input.id)
    }
    return (await this.getById(input.id))!
  }

  async duplicate(id: string, ownerId: string): Promise<CleaningJob> {
    const source = await this.getById(id)
    if (!source || source.ownerId !== ownerId) throw new Error('Job not found')
    return this.create({
      ...source, ownerId, assignedCleanerId: null, acceptedOfferId: null, status: 'draft',
    })
  }

  async remove(id: string): Promise<void> {
    const { data: images, error: imageError } = await this.client.from('job_images').select('storage_path').eq('job_id', id)
    throwIfSupabaseError(imageError)
    const paths = (images as Array<{ storage_path: string }>).map((image) => image.storage_path)
    if (paths.length) {
      const { error: storageError } = await this.client.storage.from('job-images').remove(paths)
      if (storageError) throw new Error(storageError.message)
    }
    const { error } = await this.client.from('jobs').delete().eq('id', id)
    throwIfSupabaseError(error)
  }

  async listActivities(jobId: string): Promise<JobActivity[]> {
    const { data, error } = await this.client.from('job_activities').select('*').eq('job_id', jobId).order('occurred_at', { ascending: false })
    throwIfSupabaseError(error)
    return (data as DbRow[]).map(mapActivity)
  }

  async progress(id: string, _cleanerId: string, status: 'cleaner_confirmed' | 'in_progress' | 'completed'): Promise<CleaningJob> {
    const { data, error } = await this.client.rpc('progress_job', { target_job_id: id, target_status: status }).single()
    throwIfSupabaseError(error)
    return mapJob(data as DbRow)
  }

  private async finalizeImages(paths: string[], ownerId: string, jobId: string) {
    for (const [sortOrder, source] of paths.entries()) {
      if (!source.startsWith(`${ownerId}/drafts/`)) continue
      const filename = source.split('/').pop()
      if (!filename) continue
      const destination = `${ownerId}/${jobId}/${filename}`
      const { error: moveError } = await this.client.storage.from('job-images').move(source, destination)
      if (moveError) throw new Error(moveError.message)
      const { error } = await this.client.from('job_images').insert({
        job_id: jobId, owner_id: ownerId, storage_path: destination, sort_order: sortOrder,
      })
      throwIfSupabaseError(error)
    }
  }

  private async mapWithSignedImages(record: DbRow): Promise<CleaningJob> {
    const images = Array.isArray(record.job_images) ? record.job_images as DbRow[] : []
    const signedImages = await Promise.all(images.map(async (image) => {
      const path = String(image.storage_path)
      const { data } = await this.client.storage.from('job-images').createSignedUrl(path, 15 * 60)
      return { ...image, signed_url: data?.signedUrl ?? '' }
    }))
    return mapJob({ ...record, job_images: signedImages })
  }
}
