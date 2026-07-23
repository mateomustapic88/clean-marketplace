<template>
  <BaseBadge :variant="variant">{{ t(`owner.status.${status}`) }}</BaseBadge>
</template>

<script setup lang="ts">
import type { CleaningJobStatus } from '~/domains/jobs/types'

const props = defineProps<{ status: CleaningJobStatus }>()
const { t } = useI18n()
const variant = computed(() => props.status === 'completed' ? 'success' : props.status === 'cancelled' ? 'error' : props.status === 'draft' ? 'neutral' : props.status === 'archived' ? 'warning' : 'primary')
</script>
