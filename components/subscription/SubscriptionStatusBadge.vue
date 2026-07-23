<template>
  <BaseBadge :variant="variant">{{ t(`billing.status.${status}`) }}</BaseBadge>
</template>

<script setup lang="ts">
import type { SubscriptionStatus } from '~/domains/subscriptions/types'

const props = defineProps<{ status: SubscriptionStatus }>()
const { t } = useI18n()
const variant = computed(() => props.status === 'active' ? 'success' : props.status === 'trial' ? 'primary' : props.status === 'past_due' ? 'warning' : 'error')
</script>
