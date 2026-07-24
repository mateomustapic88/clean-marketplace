<template>
  <div class="favourites-page"><header><h1>{{ t('cleaner.favourites.title') }}</h1><p>{{ t('cleaner.favourites.description') }}</p></header><FavouriteJobs :jobs="favouriteJobs" :city-name="cityName" @toggle="toggle" /></div>
</template>

<script setup lang="ts">
import type { CleanerProfile } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { normalizeCleanerProfile } from '~/utils/cleaner'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/favoriti', en: '/dashboard-cleaner/favourites', sl: '/nadzorna-plosca-cistilec/priljubljeni' } })
const { t } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), userStore = useUserStore()
const load = async (id?: string) => {
  if (id) await Promise.all([jobsStore.loadJobs(), userStore.loadCurrentProfile(id), userStore.loadDirectory()])
}
watch(() => authStore.user?.id, load, { immediate: true })
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? normalizeCleanerProfile(userStore.profile as CleanerProfile) : null)
const favouriteJobs = computed(() => jobsStore.jobs.filter((job) => profile.value?.favouriteJobIds?.includes(job.id)))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const toggle = async (jobId: string) => {
  await userStore.toggleFavouriteJob(jobId)
}
useSeoMeta({ title: () => t('cleaner.favourites.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.favourites-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } }
</style>
