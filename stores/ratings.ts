import { defineStore } from 'pinia'
import type {
  CreateRatingInput,
  Rating,
  RatingSummary,
  UpdateRatingInput,
} from '~/domains/ratings/types'

export const useRatingsStore = defineStore('ratings', () => {
  const ratings = ref<Rating[]>([])
  const isLoading = ref(false)
  const summary = ref<RatingSummary | null>(null)

  const repositories = () => useNuxtApp().$repositories

  const loadForUser = async (userId: string) => {
    isLoading.value = true
    try {
      const [items, ratingSummary] = await Promise.all([
        repositories().ratings.listByUser(userId),
        repositories().ratings.summaryForUser(userId),
      ])
      ratings.value = items
      summary.value = ratingSummary
    }
    finally {
      isLoading.value = false
    }
  }

  const loadForJob = async (jobId: string) => {
    isLoading.value = true
    try {
      ratings.value = await repositories().ratings.listByJob(jobId)
    }
    finally {
      isLoading.value = false
    }
  }

  const createRating = async (input: CreateRatingInput) => {
    const rating = await repositories().ratings.create(input)
    ratings.value.unshift(rating)
    return rating
  }

  const updateRating = async (input: UpdateRatingInput, authorId: string) => {
    const rating = await repositories().ratings.update(input, authorId)
    const index = ratings.value.findIndex((item) => item.id === rating.id)
    if (index >= 0) ratings.value[index] = rating
    return rating
  }

  return {
    ratings,
    isLoading,
    summary,
    loadForUser,
    loadForJob,
    createRating,
    updateRating,
  }
})
