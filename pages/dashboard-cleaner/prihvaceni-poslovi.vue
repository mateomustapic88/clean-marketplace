<template>
  <div class="accepted-jobs-page"><header><h1>{{ t('cleaner.accepted.title') }}</h1><p>{{ t('cleaner.accepted.description') }}</p></header><BaseEmptyState v-if="!accepted.length" :title="t('cleaner.accepted.empty')" :description="t('cleaner.accepted.emptyDescription')" /><div class="accepted-jobs-page__grid"><AcceptedJobCard v-for="job in accepted" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getCleanerJobRoute(job.id, locale)" /></div></div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { getCleanerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/prihvaceni-poslovi', en: '/dashboard-cleaner/accepted-jobs', sl: '/nadzorna-plosca-cistilec/sprejeta-dela' } })
const { t, locale } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), userStore = useUserStore()
const load = async (id?: string) => {
  if (id) await Promise.all([jobsStore.loadJobs({ cleanerId: id }), userStore.loadDirectory()])
}
watch(() => authStore.user?.id, load, { immediate: true })
const accepted = computed(() => jobsStore.jobs.filter((job) => ['assigned', 'cleaner_confirmed', 'in_progress', 'completed'].includes(job.status)))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
useSeoMeta({ title: () => t('cleaner.accepted.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.accepted-jobs-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } &__grid { display: grid; gap: $space-5; } @media (min-width: $breakpoint-md) { &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>
