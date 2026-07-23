<template>
  <BaseBadge :variant="variant">{{ t(`billing.status.${status}`) }}</BaseBadge>
</template>

<script setup lang="ts">
import type { BillingDisplayStatus } from '~/services/billing/billingPresentation'

const props = defineProps<{ status: BillingDisplayStatus }>()
const { t } = useI18n()
const variant = computed(() => {
  if (props.status === 'active') return 'success'
  if (props.status === 'trial') return 'primary'
  if (props.status === 'not_subscribed') return 'neutral'
  if (props.status === 'past_due') return 'warning'
  return 'error'
})
</script>
