<template>
  <div class="offer-page">
    <Breadcrumbs :items="breadcrumbs" />
    <header><h1>{{ existing ? t('cleaner.offer.editTitle') : t('cleaner.offer.newTitle') }}</h1><p>{{ job?.title }}</p></header>
    <BaseCard v-if="job && (!existing || existing.status === 'pending')"><OfferEditor v-model="form" :submit-label="existing ? t('cleaner.offer.save') : t('cleaner.offer.submit')" :withdrawable="Boolean(existing)" :error-message="errorMessage" @submit="submit" @withdraw="withdraw" /></BaseCard>
    <OfferCard v-else-if="existing" :offer="existing" :job="job" />
    <BaseEmptyState v-else :title="t('jobDetail.notFound')" :description="t('jobDetail.notFoundDescription')" />
  </div>
</template>

<script setup lang="ts">
import { DomainError } from '~/domains/shared/errors'
import type { OfferFormData } from '~/schemas/validation'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useOffersStore } from '~/stores/offers'
import { emptyOfferForm } from '~/utils/cleaner'
import { getAppRoute, getCleanerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role', 'subscription'], roles: ['cleaner'], subscriptionCapability: 'submit_offers' })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/poslovi/[id]/ponuda', en: '/dashboard-cleaner/jobs/[id]/offer' } })
const route = useRoute(), { t, locale } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), offersStore = useOffersStore()
const jobId = String(route.params.id), form = ref<OfferFormData>(emptyOfferForm()), errorMessage = ref('')
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([jobsStore.loadJob(jobId), offersStore.loadForCleaner(id)])
  if (existing.value) {
    form.value = {
      proposedPrice: existing.value.proposedPrice,
      priceType: existing.value.priceType,
      estimatedDurationHours: existing.value.estimatedDurationHours,
      availableArrivalTime: existing.value.availableArrivalTime,
      message: existing.value.message,
      suppliesIncluded: existing.value.suppliesIncluded,
      expiresAt: existing.value.expiresAt.slice(0, 16),
    }
  }
}
watch(() => authStore.user?.id, load, { immediate: true })
const job = computed(() => jobsStore.selectedJob)
const existing = computed(() => offersStore.offers.find((offer) => offer.jobId === jobId))
const breadcrumbs = computed(() => [{ label: t('cleaner.navigation.jobs'), to: getAppRoute('cleanerJobs', locale.value) }, { label: job.value?.title ?? '', to: getCleanerJobRoute(jobId, locale.value) }, { label: t('cleaner.offer.title') }])
const handleError = (error: unknown) => {
  const code = error instanceof DomainError ? error.code : 'unknown'
  errorMessage.value = t(`cleaner.offer.errors.${code}`)
}
const submit = async (value: OfferFormData) => {
  if (!authStore.user || !job.value) return
  try {
    if (existing.value) await offersStore.updateOffer({ id: existing.value.id, ...value }, authStore.user.id)
    else await offersStore.createOffer({ ...value, jobId, cleanerId: authStore.user.id })
    await navigateTo(getAppRoute('cleanerOffers', locale.value))
  }
  catch (error) { handleError(error) }
}
const withdraw = async () => {
  if (!existing.value || !authStore.user) return
  try {
    await offersStore.withdrawOffer(existing.value.id, authStore.user.id)
    await navigateTo(getAppRoute('cleanerOffers', locale.value))
  }
  catch (error) { handleError(error) }
}
useSeoMeta({ title: () => t('cleaner.offer.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.offer-page { display: grid; gap: $space-6; max-width: 54rem; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } }
</style>
