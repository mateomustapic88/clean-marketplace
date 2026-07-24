<template>
  <BaseCard class="job-summary-card">
    <header><div><DemoBadge v-if="job.isDemo" type="listing" /><h3><NuxtLink :to="to">{{ job.title }}</NuxtLink></h3></div><StatusBadge :status="job.status" /></header>
    <dl>
      <div><dt>{{ t('catalog.city') }}</dt><dd>{{ city }}</dd></div>
      <div><dt>{{ t('jobDetail.date') }}</dt><dd>{{ formatPublicDate(job.preferredDate, locale) }}</dd></div>
      <div><dt>{{ t('jobDetail.budget') }}</dt><dd>{{ formatPrice(job.proposedBudget, locale) }}</dd></div>
      <div><dt>{{ t('jobDetail.offerCount', { count: job.offerCount }) }}</dt><dd>{{ job.offerCount }}</dd></div>
    </dl>
    <footer>
      <BaseButton size="sm" variant="secondary" :to="to">{{ t('owner.jobs.details') }}</BaseButton>
      <slot name="actions" />
    </footer>
  </BaseCard>
</template>

<script setup lang="ts">
import type { CleaningJob } from '~/domains/jobs/types'
import { formatPrice, formatPublicDate } from '~/utils/formatters'

defineProps<{ job: CleaningJob, city: string, to: string }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.job-summary-card { display: grid; gap: $space-4;
  header, footer { display: flex; flex-wrap: wrap; gap: $space-3; align-items: flex-start; justify-content: space-between; }
  h3 { margin-top: $space-2; font-size: $font-size-lg; } h3 a { color: inherit; }
  dl { display: grid; gap: $space-2; } dl div { display: flex; justify-content: space-between; gap: $space-4; }
  dt { color: $color-text-secondary; } footer { align-items: center; }
}
</style>
