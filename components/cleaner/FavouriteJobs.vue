<template>
  <div class="favourite-jobs">
    <BaseEmptyState v-if="!jobs.length" :title="t('cleaner.favourites.empty')" :description="t('cleaner.favourites.emptyDescription')" />
    <JobSummaryCard v-for="job in jobs" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getCleanerJobRoute(job.id, locale)">
      <template #actions><FavouriteButton active @toggle="$emit('toggle', job.id)" /></template>
    </JobSummaryCard>
  </div>
</template>

<script setup lang="ts">
import type { CleaningJob } from '~/domains/jobs/types'
import { getCleanerJobRoute } from '~/utils/routes'

defineProps<{ jobs: CleaningJob[], cityName: (code: string) => string }>()
defineEmits<{ toggle: [jobId: string] }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.favourite-jobs { display: grid; gap: $space-5; @media (min-width: $breakpoint-md) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
