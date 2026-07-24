<template>
  <div class="contact-page">
    <PageHero :eyebrow="t('contact.eyebrow')" :title="t('contact.title')" :description="t('contact.description')" />
    <section class="contact-page__section container">
      <BaseCard class="contact-page__card">
        <BaseAlert v-if="submitted" variant="success" :title="t('contact.successTitle')">
          {{ t('contact.successDescription') }}
        </BaseAlert>
        <form v-else novalidate @submit.prevent="submit">
          <BaseAlert
            v-if="submitError"
            variant="error"
            :title="t('contact.errorTitle')"
          >
            {{ t('contact.errorDescription') }}
          </BaseAlert>
          <BaseInput v-model="form.name" name="name" autocomplete="name" required :label="t('contact.fields.name')" :error="errors.name ?? ''" />
          <BaseInput v-model="form.email" name="email" type="email" autocomplete="email" required :label="t('contact.fields.email')" :error="errors.email ?? ''" />
          <BaseSelect v-model="form.userType" name="userType" required :label="t('contact.fields.userType')" :options="userTypes" :error="errors.userType ?? ''" />
          <BaseInput v-model="form.subject" name="subject" required :label="t('contact.fields.subject')" :error="errors.subject ?? ''" />
          <BaseTextarea v-model="form.message" name="message" required :label="t('contact.fields.message')" :error="errors.message ?? ''" />
          <BaseCheckbox v-model="form.consent" :label="t('contact.fields.consent')" />
          <p v-if="errors.consent" class="contact-page__error" role="alert">{{ errors.consent }}</p>
          <BaseButton block size="lg" type="submit" :loading="loading" :disabled="loading">{{ t('contact.submit') }}</BaseButton>
        </form>
      </BaseCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { createContactSchema } from '~/schemas/validation'
import { getAppRoute } from '~/utils/routes'
import { getFieldErrors } from '~/utils/validation'

defineI18nRoute({ paths: { hr: '/kontakt', en: '/contact' } })
const { t, locale } = useI18n()
const route = useRoute()
const form = reactive({ name: '', email: '', userType: 'owner' as 'owner' | 'cleaner' | 'other', subject: '', message: '', consent: false })
const errors = ref<Record<string, string>>({})
const loading = ref(false)
const submitted = ref(false)
const submitError = ref(false)
const userTypes = computed(() => ['owner', 'cleaner', 'other'].map((value) => ({ value, label: t(`contact.userTypes.${value}`) })))

const topic = computed(() => {
  const value = Array.isArray(route.query.topic) ? route.query.topic[0] : route.query.topic
  return value === 'bug' || value === 'feature' || value === 'support' ? value : null
})

watchEffect(() => {
  if (topic.value && !form.subject) {
    form.subject = t(`contact.topics.${topic.value}`)
  }
})

const submit = async () => {
  if (loading.value) return
  submitError.value = false
  const result = createContactSchema(t).safeParse(form)
  if (!result.success) {
    errors.value = getFieldErrors(result.error)
    return
  }
  errors.value = {}
  loading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 400))
    submitted.value = true
    useAnalytics().track({
      name: 'feedback_submitted',
      properties: { topic: topic.value ?? 'contact' },
    })
  }
  catch {
    submitError.value = true
  }
  finally {
    loading.value = false
  }
}
usePublicSeo({
  title: computed(() => t('contact.metaTitle')),
  description: computed(() => t('contact.metaDescription')),
  path: computed(() => getAppRoute('contact', locale.value)),
})
</script>

<style scoped lang="scss">
.contact-page {
  &__section {
    padding-block: $space-16;
  }

  &__card {
    max-width: 42rem;
    margin-inline: auto;
  }

  form {
    display: grid;
    gap: $space-5;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-error;
  }
}
</style>
