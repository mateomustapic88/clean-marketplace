<template>
  <BaseCard class="offer-comparison-card">
    <header><div class="offer-comparison-card__cleaner"><BaseAvatar :name="name" /><div><h3>{{ name }}</h3><RatingSummary :value="cleaner.averageRating" :count="cleaner.ratingCount" /></div></div><OfferStatusBadge :status="offer.status" /></header>
    <dl>
      <div><dt>{{ t('cleaner.profile.completedJobs') }}</dt><dd>{{ cleaner.completedJobs }}</dd></div>
      <div><dt>{{ t('cleaner.profile.hourlyRate') }}</dt><dd>{{ formatPrice(cleaner.hourlyRate, locale) }}</dd></div>
      <div><dt>{{ t('cleaner.offer.fields.price') }}</dt><dd>{{ formatPrice(offer.proposedPrice, locale) }}</dd></div>
      <div><dt>{{ t('cleaner.offer.fields.arrival') }}</dt><dd>{{ offer.availableArrivalTime }}</dd></div>
      <div><dt>{{ t('cleaner.offer.fields.duration') }}</dt><dd>{{ offer.estimatedDurationHours }} h</dd></div>
    </dl>
    <p>{{ offer.message }}</p>
    <div v-if="showContact && user" class="offer-comparison-card__contact"><strong>{{ t('marketplace.contact.title') }}</strong><a :href="`mailto:${user.email}`">{{ user.email }}</a><a :href="`tel:${cleaner.phone}`">{{ cleaner.phone }}</a></div>
    <footer v-if="offer.status === 'pending'"><BaseButton size="sm" @click="$emit('accept')">{{ t('owner.offers.accept') }}</BaseButton><BaseButton size="sm" variant="danger" @click="$emit('reject')">{{ t('owner.offers.reject') }}</BaseButton></footer>
  </BaseCard>
</template>

<script setup lang="ts">
import type { JobOffer } from '~/domains/offers/types'
import type { CleanerProfile, User } from '~/domains/users/types'
import { formatPrice } from '~/utils/formatters'

const props = defineProps<{ offer: JobOffer, cleaner: CleanerProfile, user?: User | undefined, showContact?: boolean }>()
defineEmits<{ accept: [], reject: [] }>()
const { t, locale } = useI18n()
const name = computed(() => `${props.cleaner.firstName} ${props.cleaner.lastName}`)
</script>

<style scoped lang="scss">
.offer-comparison-card { display: grid; gap: $space-4; header, footer, &__cleaner { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; justify-content: space-between; } &__cleaner { justify-content: flex-start; } dl { display: grid; gap: $space-2; } dl div { display: flex; justify-content: space-between; gap: $space-3; } dt { color: $color-text-secondary; } &__contact { display: grid; gap: $space-2; padding: $space-4; background: $color-primary-light; border-radius: $radius-md; } }
</style>
