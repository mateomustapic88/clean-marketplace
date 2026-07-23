<template>
  <div class="job-actions">
    <BaseButton v-if="!isPublishedJobReadOnly(job.status)" size="sm" variant="ghost" :to="getOwnerJobEditRoute(job.id, locale)">{{ t('owner.jobs.edit') }}</BaseButton>
    <BaseButton size="sm" variant="ghost" @click="$emit('duplicate')">{{ t('owner.jobs.duplicate') }}</BaseButton>
    <BaseButton v-if="['published', 'receiving_offers', 'completed', 'cancelled'].includes(job.status)" size="sm" variant="ghost" @click="$emit('archive')">{{ t('owner.jobs.archive') }}</BaseButton>
    <BaseButton v-if="['published', 'receiving_offers', 'assigned', 'in_progress'].includes(job.status)" size="sm" variant="ghost" @click="$emit('cancel')">{{ t('owner.jobs.cancel') }}</BaseButton>
    <BaseButton v-if="['archived', 'cancelled'].includes(job.status)" size="sm" variant="ghost" @click="$emit('republish')">{{ t('owner.jobs.republish') }}</BaseButton>
    <BaseButton v-if="job.status === 'draft'" size="sm" variant="ghost" @click="$emit('delete')">{{ t('owner.jobs.delete') }}</BaseButton>
  </div>
</template>

<script setup lang="ts">
import type { CleaningJob } from '~/domains/jobs/types'
import { isPublishedJobReadOnly } from '~/services/jobs/jobLifecycle'
import { getOwnerJobEditRoute } from '~/utils/routes'

defineProps<{ job: CleaningJob }>()
defineEmits<{ duplicate: [], archive: [], cancel: [], republish: [], delete: [] }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.job-actions { display: flex; flex-wrap: wrap; gap: $space-1; }
</style>
