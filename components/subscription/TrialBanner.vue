<template>
  <BaseAlert v-if="subscription?.status === 'trial'" variant="info" :title="t('billing.trial.title')">
    {{ t('billing.trial.remaining', { days }) }}
  </BaseAlert>
</template>

<script setup lang="ts">
import type { Subscription } from '~/domains/subscriptions/types'

defineProps<{ subscription: Subscription | null, days: number }>()
const { t } = useI18n()
</script>
