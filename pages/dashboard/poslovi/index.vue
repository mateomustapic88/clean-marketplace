<template>
  <div class="owner-jobs">
    <header class="owner-jobs__header"><div><h1>{{ t('owner.jobs.title') }}</h1><p>{{ t('owner.jobs.description') }}</p></div><BaseButton :loading="isCheckingAccess" @click="openNewJob"><Plus :size="18" />{{ t('owner.jobs.new') }}</BaseButton></header>
    <BaseCard class="owner-jobs__filters">
      <BaseInput v-model="search" type="search" :label="t('catalog.search')" />
      <BaseSelect v-model="status" :label="t('owner.jobs.statusFilter')" :placeholder="t('catalog.allOptions')" :options="statusOptions" />
      <BaseSelect v-model="city" :label="t('catalog.city')" :placeholder="t('catalog.allCities')" :options="cityOptions" />
      <BaseInput v-model="date" type="date" :label="t('owner.jobs.dateFilter')" />
      <BaseSelect v-model="sort" :label="t('catalog.sort')" :options="sortOptions" />
      <div class="owner-jobs__views"><button type="button" :aria-pressed="view === 'cards'" @click="view = 'cards'"><LayoutGrid :size="18" />{{ t('owner.jobs.cards') }}</button><button type="button" :aria-pressed="view === 'table'" @click="view = 'table'"><Table2 :size="18" />{{ t('owner.jobs.table') }}</button></div>
    </BaseCard>
    <BaseEmptyState v-if="!filtered.length" :title="t('owner.jobs.empty')" :description="t('owner.jobs.emptyDescription')" />
    <div v-else-if="view === 'cards'" class="owner-jobs__grid">
      <JobSummaryCard v-for="job in filtered" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getOwnerJobRoute(job.id, locale)">
        <template #actions><JobActions :job="job" @duplicate="duplicate(job.id)" @archive="transition(job.id, 'archived')" @cancel="transition(job.id, 'cancelled')" @republish="transition(job.id, 'published')" @delete="requestDelete(job)" /></template>
      </JobSummaryCard>
    </div>
    <div v-else class="owner-jobs__table-wrap">
      <table>
        <thead><tr><th>{{ t('owner.job.fields.title') }}</th><th>{{ t('catalog.city') }}</th><th>{{ t('owner.jobs.statusFilter') }}</th><th>{{ t('jobDetail.date') }}</th><th>{{ t('jobDetail.offerCount', { count: 0 }) }}</th><th>{{ t('owner.jobs.actions') }}</th></tr></thead>
        <tbody><tr v-for="job in filtered" :key="job.id"><td><NuxtLink :to="getOwnerJobRoute(job.id, locale)">{{ job.title }}</NuxtLink></td><td>{{ cityName(job.cityCode) }}</td><td><StatusBadge :status="job.status" /></td><td>{{ formatPublicDate(job.preferredDate, locale) }}</td><td>{{ job.offerCount }}</td><td><JobActions :job="job" @duplicate="duplicate(job.id)" @archive="transition(job.id, 'archived')" @cancel="transition(job.id, 'cancelled')" @republish="transition(job.id, 'published')" @delete="requestDelete(job)" /></td></tr></tbody>
      </table>
    </div>
    <BaseModal v-model="deleteOpen" :title="t('owner.jobs.deleteTitle')" :description="t('owner.jobs.deleteDescription')">
      <template #footer><BaseButton variant="secondary" @click="deleteOpen = false">{{ t('common.close') }}</BaseButton><BaseButton variant="danger" @click="deleteDraft">{{ t('owner.jobs.delete') }}</BaseButton></template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { LayoutGrid, Plus, Table2 } from '@lucide/vue'
import type { CleaningJob, CleaningJobStatus } from '~/domains/jobs/types'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { formatPublicDate } from '~/utils/formatters'
import { getOwnerJobEditRoute, getOwnerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/poslovi', en: '/dashboard/jobs', sl: '/nadzorna-plosca/dela' } })
const { t, locale } = useI18n()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const userStore = useUserStore()
const { isCheckingAccess, openNewJob } = useOwnerJobAccess()
const { ensureCompletedProfile } = useProfileCompletionGuard()
const search = ref('')
const status = ref('')
const city = ref('')
const date = ref('')
const sort = ref('newest')
const view = ref<'cards' | 'table'>('cards')
const deleteOpen = ref(false)
const deleteTarget = ref<CleaningJob | null>(null)
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([
    jobsStore.loadJobs({
      ownerId: id,
      ...(search.value && { search: search.value }),
    }),
    userStore.loadDirectory(),
  ])
}
watch(() => authStore.user?.id, load, { immediate: true })
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(authStore.user?.id), 250)
})
const filtered = computed(() => jobsStore.jobs.filter((job) => (!status.value || job.status === status.value) && (!city.value || job.cityCode === city.value) && (!date.value || job.preferredDate === date.value)).sort((a, b) => search.value ? 0 : sort.value === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : sort.value === 'date' ? a.preferredDate.localeCompare(b.preferredDate) : sort.value === 'offers' ? b.offerCount - a.offerCount : b.createdAt.localeCompare(a.createdAt)))
const statuses: CleaningJobStatus[] = ['draft', 'published', 'receiving_offers', 'assigned', 'in_progress', 'completed', 'archived', 'cancelled']
const statusOptions = computed(() => statuses.map((value) => ({ value, label: t(`owner.status.${value}`) })))
const cityOptions = computed(() => userStore.cities.map((item) => ({ value: item.code, label: item.name })))
const sortOptions = computed(() => ['newest', 'oldest', 'date', 'offers'].map((value) => ({ value, label: t(`owner.jobs.sort.${value}`) })))
const cityName = (code: string) => userStore.cities.find((item) => item.code === code)?.name ?? code
const transition = async (id: string, next: CleaningJobStatus) => {
  if (next === 'published' && !await ensureCompletedProfile()) return
  await jobsStore.transitionJob(id, next)
}
const duplicate = async (id: string) => {
  if (!authStore.user) return
  const job = await jobsStore.duplicateJob(id, authStore.user.id)
  await navigateTo(getOwnerJobEditRoute(job.id, locale.value))
}
const requestDelete = (job: CleaningJob) => {
  deleteTarget.value = job
  deleteOpen.value = true
}
const deleteDraft = async () => {
  if (deleteTarget.value) await jobsStore.removeJob(deleteTarget.value.id)
  deleteOpen.value = false
}
useSeoMeta({ title: () => t('owner.jobs.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-jobs { display: grid; gap: $space-6;
  &__header { display: flex; flex-wrap: wrap; gap: $space-4; align-items: center; justify-content: space-between; h1 { font-size: $font-size-3xl; } p { margin-top: $space-2; color: $color-text-secondary; } }
  &__filters { display: grid; gap: $space-4; } &__views { display: flex; gap: $space-2; align-items: end; }
  &__views button { display: flex; gap: $space-2; align-items: center; min-height: 3rem; padding: $space-3; background: $color-surface; border: 1px solid $color-border; border-radius: $radius-md; }
  &__views button[aria-pressed=true] { color: $color-surface; background: $color-primary; }
  &__grid { display: grid; gap: $space-5; }
  &__table-wrap { overflow-x: auto; background: $color-surface; border: 1px solid $color-border; border-radius: $radius-lg; }
  table { width: 100%; min-width: 54rem; border-collapse: collapse; } th, td { padding: $space-4; text-align: left; border-bottom: 1px solid $color-border; }
  @media (min-width: $breakpoint-md) { &__filters { grid-template-columns: repeat(3, minmax(0, 1fr)); } &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
}
</style>
