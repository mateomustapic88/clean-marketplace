<template>
  <div class="cleaner-offers-page"><header><h1>{{ t('cleaner.offers.title') }}</h1><p>{{ t('cleaner.offers.description') }}</p></header><BaseSelect v-model="status" :label="t('owner.jobs.statusFilter')" :placeholder="t('catalog.allOptions')" :options="statusOptions" /><BaseEmptyState v-if="!filtered.length" :title="t('cleaner.offers.empty')" :description="t('cleaner.offers.emptyDescription')" /><div class="cleaner-offers-page__grid"><OfferCard v-for="offer in filtered" :key="offer.id" :offer="offer" :job="jobFor(offer.jobId)" :to="subscriptionStore.capabilities.submit_offers ? getCleanerOfferRoute(offer.jobId, locale) : ''"><template v-if="offer.status === 'accepted' && subscriptionStore.capabilities.view_contact" #contact><div class="cleaner-offers-page__contact"><strong>{{ t('marketplace.contact.owner') }}</strong><a v-if="ownerUser(offer.jobId)" :href="`mailto:${ownerUser(offer.jobId)?.email}`">{{ ownerUser(offer.jobId)?.email }}</a><a v-if="ownerProfile(offer.jobId)" :href="`tel:${ownerProfile(offer.jobId)?.phone}`">{{ ownerProfile(offer.jobId)?.phone }}</a></div></template></OfferCard></div></div>
</template>

<script setup lang="ts">
import type { OfferStatus } from '~/domains/offers/types'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useOffersStore } from '~/stores/offers'
import { useSubscriptionStore } from '~/stores/subscription'
import { useUserStore } from '~/stores/user'
import { getCleanerOfferRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/ponude', en: '/dashboard-cleaner/offers' } })
const { t, locale } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), offersStore = useOffersStore(), userStore = useUserStore()
const subscriptionStore = useSubscriptionStore()
const status = ref('')
const load = async (id?: string) => {
  if (id) await Promise.all([offersStore.loadForCleaner(id), jobsStore.loadJobs(), userStore.loadDirectory(), subscriptionStore.loadForUser(id, 'cleaner')])
}
watch(() => authStore.user?.id, load, { immediate: true })
const statuses: OfferStatus[] = ['pending', 'accepted', 'rejected', 'withdrawn', 'expired']
const statusOptions = computed(() => statuses.map((value) => ({ value, label: t(`cleaner.offer.status.${value}`) })))
const filtered = computed(() => offersStore.offers.filter((offer) => !status.value || offer.status === status.value))
const jobFor = (id: string) => jobsStore.jobs.find((job) => job.id === id)
const ownerUser = (jobId: string) => userStore.users.find((user) => user.id === jobFor(jobId)?.ownerId)
const ownerProfile = (jobId: string) => userStore.owners.find((owner) => owner.userId === jobFor(jobId)?.ownerId)
useSeoMeta({ title: () => t('cleaner.offers.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.cleaner-offers-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } > :deep(.base-select) { max-width: 18rem; } &__grid { display: grid; gap: $space-5; } &__contact { display: grid; gap: $space-2; padding: $space-3; background: $color-primary-light; border-radius: $radius-md; } @media (min-width: $breakpoint-md) { &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>
