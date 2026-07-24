<template>
  <AuthShell
    :eyebrow="t('auth.reset.eyebrow')"
    :title="t('auth.reset.title')"
    :description="t('auth.reset.description')"
  >
    <form class="reset-password__form" novalidate @submit.prevent="submit">
      <BaseAlert v-if="success" variant="success" :title="t('auth.reset.successTitle')">
        {{ t('auth.reset.successDescription') }}
      </BaseAlert>
      <BaseAlert v-if="failed" variant="error" :title="t('auth.errors.title')">
        {{ t('auth.errors.invalid_reset_link') }}
      </BaseAlert>
      <BaseInput
        v-model="password"
        type="password"
        name="password"
        autocomplete="new-password"
        required
        :label="t('auth.fields.password')"
        :error="error"
      />
      <BaseInput
        v-model="confirmation"
        type="password"
        name="passwordConfirmation"
        autocomplete="new-password"
        required
        :label="t('auth.reset.confirmPassword')"
      />
      <BaseButton block size="lg" type="submit" :loading="loading" :disabled="loading || success">
        {{ t('auth.reset.submit') }}
      </BaseButton>
      <BaseButton block variant="ghost" :to="getAppRoute('login', locale)">
        {{ t('auth.forgot.backToLogin') }}
      </BaseButton>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import AuthShell from '~/components/auth/AuthShell.vue'
import { useAuthStore } from '~/stores/auth'
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/nova-lozinka', en: '/reset-password' } })
const { t, locale } = useI18n()
const auth = useAuthStore()
const password = ref('')
const confirmation = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)
const failed = ref(false)

const submit = async () => {
  if (loading.value) return
  failed.value = false
  if (password.value.length < 8) {
    error.value = t('validation.passwordLength', { count: 8 })
    return
  }
  if (password.value !== confirmation.value) {
    error.value = t('auth.reset.passwordMismatch')
    return
  }
  error.value = ''
  loading.value = true
  try {
    await auth.updatePassword(password.value)
    success.value = true
  }
  catch {
    failed.value = true
  }
  finally {
    loading.value = false
  }
}

usePublicSeo({
  title: computed(() => t('auth.reset.metaTitle')),
  description: computed(() => t('auth.reset.metaDescription')),
  path: computed(() => getAppRoute('resetPassword', locale.value)),
})
</script>

<style scoped lang="scss">
.reset-password__form {
  display: grid;
  gap: $space-5;
}
</style>
