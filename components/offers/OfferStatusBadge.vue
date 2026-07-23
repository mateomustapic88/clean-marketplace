<template>
  <BaseBadge :variant="variant">{{ t(`cleaner.offer.status.${status}`) }}</BaseBadge>
</template>

<script setup lang="ts">
import type { OfferStatus } from '~/domains/offers/types'

const props = defineProps<{ status: OfferStatus }>()
const { t } = useI18n()
const variant = computed(() => props.status === 'accepted' ? 'success' : props.status === 'rejected' || props.status === 'withdrawn' ? 'error' : props.status === 'expired' ? 'warning' : 'primary')
</script>
