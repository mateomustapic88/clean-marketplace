<template>
  <AuthShell
    :eyebrow="t('auth.forgot.eyebrow')"
    :title="t('auth.forgot.title')"
    :description="t('auth.forgot.description')"
  >
    <form class="forgot-page__form" novalidate @submit.prevent="submit">
      <BaseAlert
        v-if="submitted"
        variant="success"
        :title="t('auth.forgot.successTitle')"
      >
        {{ t('auth.forgot.successDescription') }}
      </BaseAlert>
      <BaseAlert
        v-if="submitError"
        variant="error"
        :title="t('auth.errors.title')"
      >
        {{ t('auth.errors.unknown') }}
      </BaseAlert>
      <BaseInput
        v-model="email"
        type="email"
        name="email"
        autocomplete="email"
        required
        :label="t('auth.fields.email')"
        :placeholder="t('auth.fields.emailPlaceholder')"
        :error="error"
      />
      <BaseButton block size="lg" type="submit" :loading="loading">
        {{ t('auth.forgot.submit') }}
      </BaseButton>
      <BaseButton
        block
        variant="ghost"
        :to="getAppRoute('login', locale)"
      >
        {{ t('auth.forgot.backToLogin') }}
      </BaseButton>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { z } from 'zod'
import AuthShell from '~/components/auth/AuthShell.vue'
import { useAuthStore } from '~/stores/auth'
import { getAppRoute } from '~/utils/routes'

definePageMeta({
  middleware: ['guest'],
})

defineI18nRoute({
  paths: {
    hr: '/zaboravljena-lozinka',
    en: '/forgot-password',
    sl: '/pozabljeno-geslo',
  },
})

const { t, locale } = useI18n()
const authStore = useAuthStore()
const email = ref('')
const error = ref('')
const submitted = ref(false)
const loading = ref(false)
const submitError = ref(false)

const submit = async () => {
  if (loading.value) return
  submitted.value = false
  submitError.value = false
  const result = z.string().trim().email(t('validation.email')).safeParse(email.value)
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? t('validation.email')
    return
  }

  error.value = ''
  loading.value = true
  try {
    await authStore.requestPasswordReset(result.data)
    submitted.value = true
  }
  catch {
    submitError.value = true
  }
  finally {
    loading.value = false
  }
}

usePublicSeo({
  title: computed(() => t('auth.forgot.metaTitle')),
  description: computed(() => t('auth.forgot.metaDescription')),
  path: computed(() => getAppRoute('forgotPassword', locale.value)),
})
</script>

<style scoped lang="scss">
.forgot-page {
  &__form {
    display: grid;
    gap: $space-5;
  }
}
</style>
