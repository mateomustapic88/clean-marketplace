import { defineStore } from 'pinia'
import type { City } from '~/domains/shared/types'
import type {
  CleanerProfile,
  OwnerProfile,
  User,
  UserProfile,
} from '~/domains/users/types'
import type { PublicCleanerSearch } from '~/domains/search/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const users = ref<User[]>([])
  const owners = ref<OwnerProfile[]>([])
  const cleaners = ref<CleanerProfile[]>([])
  const cities = ref<City[]>([])
  const isLoading = ref(false)
  const cleanerSearchTotal = ref(0)
  let cleanerSearchRequest = 0

  const repositories = () => useNuxtApp().$repositories

  const loadCurrentProfile = async (userId: string) => {
    isLoading.value = true
    try {
      profile.value = await repositories().users.getProfile(userId)
    }
    finally {
      isLoading.value = false
    }
  }

  const loadDirectory = async () => {
    isLoading.value = true
    try {
      const [userList, ownerList, cleanerList, cityList] = await Promise.all([
        repositories().users.listUsers(),
        repositories().users.listOwners(),
        repositories().users.listCleaners(),
        repositories().users.listCities(),
      ])
      users.value = userList
      owners.value = ownerList
      cleaners.value = cleanerList
      cities.value = cityList
    }
    finally {
      isLoading.value = false
    }
  }

  const loadCities = async () => {
    if (cities.value.length) return
    cities.value = await repositories().users.listCities()
  }

  const searchCleaners = async (criteria: PublicCleanerSearch) => {
    const request = ++cleanerSearchRequest
    isLoading.value = true
    try {
      const result = await repositories().users.searchCleaners(criteria)
      if (request !== cleanerSearchRequest) return
      cleaners.value = result.items
      cleanerSearchTotal.value = result.total
    }
    finally {
      if (request === cleanerSearchRequest) isLoading.value = false
    }
  }

  const updateOwner = async (ownerProfile: OwnerProfile) => {
    const updatedProfile = await repositories().users.updateOwner(ownerProfile)
    profile.value = updatedProfile
    const index = owners.value.findIndex((owner) => owner.id === updatedProfile.id)
    if (index >= 0) owners.value[index] = updatedProfile
    return updatedProfile
  }

  const updateUser = async (user: User) => {
    const updatedUser = await repositories().users.updateUser(user)
    const index = users.value.findIndex((item) => item.id === updatedUser.id)
    if (index >= 0) users.value[index] = updatedUser
    return updatedUser
  }

  const updateCleaner = async (cleanerProfile: CleanerProfile) => {
    const updatedProfile = await repositories().users.updateCleaner(cleanerProfile)
    profile.value = updatedProfile
    const index = cleaners.value.findIndex((cleaner) => cleaner.id === updatedProfile.id)
    if (index >= 0) cleaners.value[index] = updatedProfile
    return updatedProfile
  }

  const toggleFavouriteJob = async (jobId: string) => {
    if (!profile.value || !('completedJobs' in profile.value)) return null
    const current = profile.value.favouriteJobIds ?? []
    const favouriteJobIds = current.includes(jobId)
      ? current.filter((id) => id !== jobId)
      : [...current, jobId]
    return updateCleaner({ ...profile.value, favouriteJobIds })
  }

  const clear = () => {
    profile.value = null
    users.value = []
    owners.value = []
    cleaners.value = []
    cities.value = []
  }

  return {
    profile,
    users,
    owners,
    cleaners,
    cities,
    isLoading,
    cleanerSearchTotal,
    loadCurrentProfile,
    loadDirectory,
    loadCities,
    searchCleaners,
    updateOwner,
    updateUser,
    updateCleaner,
    toggleFavouriteJob,
    clear,
  }
})
