import { defineStore } from 'pinia'
import type {
  CleaningJob,
  CreateCleaningJobInput,
  JobFilters,
  UpdateCleaningJobInput,
  JobActivity,
} from '~/domains/jobs/types'

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<CleaningJob[]>([])
  const selectedJob = ref<CleaningJob | null>(null)
  const isLoading = ref(false)
  const activities = ref<JobActivity[]>([])

  const repositories = () => useNuxtApp().$repositories

  const loadJobs = async (filters: JobFilters = {}) => {
    isLoading.value = true
    try {
      jobs.value = await repositories().jobs.list(filters)
    }
    finally {
      isLoading.value = false
    }
  }

  const loadJob = async (id: string) => {
    isLoading.value = true
    try {
      selectedJob.value = await repositories().jobs.getById(id)
      return selectedJob.value
    }
    finally {
      isLoading.value = false
    }
  }

  const createJob = async (input: CreateCleaningJobInput) => {
    const job = await repositories().jobs.create(input)
    jobs.value.unshift(job)
    selectedJob.value = job
    return job
  }

  const updateJob = async (input: UpdateCleaningJobInput) => {
    const job = await repositories().jobs.update(input)
    const index = jobs.value.findIndex((item) => item.id === job.id)
    if (index >= 0) jobs.value[index] = job
    if (selectedJob.value?.id === job.id) selectedJob.value = job
    return job
  }

  const removeJob = async (id: string) => {
    await repositories().jobs.remove(id)
    jobs.value = jobs.value.filter((job) => job.id !== id)
    if (selectedJob.value?.id === id) selectedJob.value = null
  }

  const transitionJob = async (id: string, status: CleaningJob['status']) =>
    updateJob({ id, status })

  const duplicateJob = async (id: string, ownerId: string) => {
    const job = await repositories().jobs.duplicate(id, ownerId)
    jobs.value.unshift(job)
    selectedJob.value = job
    return job
  }

  const loadActivities = async (jobId: string) => {
    activities.value = await repositories().jobs.listActivities(jobId)
  }

  const progressJob = async (
    id: string,
    cleanerId: string,
    status: 'cleaner_confirmed' | 'in_progress' | 'completed',
  ) => {
    const job = await repositories().jobs.progress(id, cleanerId, status)
    const index = jobs.value.findIndex((item) => item.id === job.id)
    if (index >= 0) jobs.value[index] = job
    selectedJob.value = job
    await loadActivities(job.id)
    return job
  }

  return {
    jobs,
    selectedJob,
    isLoading,
    activities,
    loadJobs,
    loadJob,
    createJob,
    updateJob,
    transitionJob,
    duplicateJob,
    removeJob,
    loadActivities,
    progressJob,
  }
})
