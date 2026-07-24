<template>
  <section class="review-page">
    <Breadcrumbs :items="breadcrumbs" />
    <BaseCard v-if="ready && job && subjectId">
      <DemoBadge type="listing" />
      <h1>{{ t('reviews.title') }}</h1>
      <p>{{ t('reviews.description', { title: job.title }) }}</p>
      <BaseAlert v-if="saved" variant="success">{{ t('reviews.saved') }}</BaseAlert>
      <BaseAlert v-if="errorMessage" variant="error">{{ errorMessage }}</BaseAlert>
      <ReviewForm
        v-model="form"
        :categories="categories"
        :submit-label="existingRating ? t('reviews.update') : t('reviews.submit')"
        :loading="saving"
        @submit="save"
      />
      <p v-if="existingRating" class="review-page__edit-window">
        {{ t('reviews.editUntil', { date: formatPublicDate(existingRating.editableUntil, locale) }) }}
      </p>
    </BaseCard>
    <BaseEmptyState v-else-if="ready" :title="t('reviews.notAllowed')" :description="t('reviews.notAllowedDescription')" />
    <BaseSkeleton v-else height="24rem" />
  </section>
</template>

<script setup lang="ts">
import type { RatingCategory, RatingCategoryScore } from '~/domains/ratings/types'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useRatingsStore } from '~/stores/ratings'
import { formatPublicDate } from '~/utils/formatters'

const props = defineProps<{
  jobId: string
  role: 'owner' | 'cleaner'
  backTo: string
}>()

const { t, locale } = useI18n()
const auth = useAuthStore()
const jobs = useJobsStore()
const ratings = useRatingsStore()
const saved = ref(false)
const ready = ref(false)
const errorMessage = ref('')
const saving = ref(false)
const ownerCategories: RatingCategory[] = ['cleaning_quality', 'reliability', 'communication', 'punctuality']
const cleanerCategories: RatingCategory[] = ['communication', 'accuracy', 'fairness', 'payment_experience']
const categories = computed(() => props.role === 'owner' ? ownerCategories : cleanerCategories)
const defaultScores = (): RatingCategoryScore[] => categories.value.map((category) => ({ category, score: 5 }))
const form = ref({ overallScore: 5, categoryScores: defaultScores(), comment: '' })

const job = computed(() => {
  const selected = jobs.selectedJob
  if (!selected || selected.status !== 'completed' || !auth.user) return null
  const isParticipant = props.role === 'owner'
    ? selected.ownerId === auth.user.id
    : selected.assignedCleanerId === auth.user.id
  return isParticipant ? selected : null
})
const subjectId = computed(() => props.role === 'owner' ? job.value?.assignedCleanerId : job.value?.ownerId)
const existingRating = computed(() => ratings.ratings.find((item) => item.authorId === auth.user?.id))
const breadcrumbs = computed(() => [
  { label: t('reviews.back'), to: props.backTo },
  { label: t('reviews.title') },
])

onMounted(async () => {
  await auth.restoreSession()
  await Promise.all([jobs.loadJob(props.jobId), ratings.loadForJob(props.jobId)])
  if (existingRating.value) {
    form.value = {
      overallScore: existingRating.value.overallScore,
      categoryScores: existingRating.value.categoryScores,
      comment: existingRating.value.comment,
    }
  }
  ready.value = true
})

const save = async () => {
  if (!job.value || !subjectId.value || !auth.user || saving.value) return
  saving.value = true
  errorMessage.value = ''
  saved.value = false
  try {
    if (existingRating.value) {
      await ratings.updateRating({
        id: existingRating.value.id,
        ...form.value,
      }, auth.user.id)
    }
    else {
      await ratings.createRating({
        jobId: job.value.id,
        authorId: auth.user.id,
        subjectId: subjectId.value,
        ...form.value,
      })
    }
    saved.value = true
  }
  catch {
    errorMessage.value = t('reviews.saveError')
  }
  finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.review-page {
  display: grid;
  gap: $space-6;
  max-width: 52rem;

  :deep(.base-card) {
    display: grid;
    gap: $space-5;
  }

  &__edit-window {
    color: $color-text-secondary;
    font-size: $font-size-sm;
  }
}
</style>
