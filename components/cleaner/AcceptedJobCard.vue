<template>
  <BaseCard class="accepted-job-card"><header><DemoBadge v-if="job.isDemo" type="listing" /><StatusBadge :status="job.status" /></header><h3>{{ job.title }}</h3><p>{{ city }} · {{ formatPublicDate(job.preferredDate, locale) }} {{ job.preferredStartTime }}</p><slot /><BaseButton size="sm" :to="to">{{ t('cleaner.jobs.open') }}</BaseButton></BaseCard>
</template>

<script setup lang="ts">
import type { CleaningJob } from '~/domains/jobs/types'
import { formatPublicDate } from '~/utils/formatters'

defineProps<{ job: CleaningJob, city: string, to: string }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.accepted-job-card { display: grid; gap: $space-4; header { display: flex; justify-content: space-between; gap: $space-3; } p { color: $color-text-secondary; } }
</style>
