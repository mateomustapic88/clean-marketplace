<template>
  <BaseCard class="offer-card">
    <header><DemoBadge type="listing" /><OfferStatusBadge :status="offer.status" /></header>
    <h3>{{ job?.title ?? t('cleaner.offer.unknownJob') }}</h3>
    <dl>
      <div><dt>{{ t('cleaner.offer.fields.price') }}</dt><dd>{{ formatPrice(offer.proposedPrice, locale) }}</dd></div>
      <div><dt>{{ t('cleaner.offer.fields.arrival') }}</dt><dd>{{ offer.availableArrivalTime }}</dd></div>
      <div><dt>{{ t('cleaner.offer.fields.duration') }}</dt><dd>{{ offer.estimatedDurationHours }} h</dd></div>
    </dl>
    <p>{{ offer.message }}</p>
    <slot name="contact" />
    <footer><BaseButton v-if="to" size="sm" :to="to">{{ t('cleaner.offer.details') }}</BaseButton><slot name="actions" /></footer>
  </BaseCard>
</template>

<script setup lang="ts">
import type { CleaningJob } from '~/domains/jobs/types'
import type { JobOffer } from '~/domains/offers/types'
import { formatPrice } from '~/utils/formatters'

defineProps<{ offer: JobOffer, job?: CleaningJob | null | undefined, to?: string }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.offer-card { display: grid; gap: $space-4; header, footer { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; justify-content: space-between; } dl { display: grid; gap: $space-2; } dl div { display: flex; justify-content: space-between; gap: $space-3; } dt { color: $color-text-secondary; } }
</style>
