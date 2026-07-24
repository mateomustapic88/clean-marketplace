<template>
  <AuthShell
    :eyebrow="t('auth.login.eyebrow')"
    :title="t('auth.login.title')"
    :description="t('auth.login.description')"
  >
    <template v-if="isMockMode" #aside>
      <BaseAlert variant="info" :title="t('auth.demo.title')">
        <p>{{ t('auth.demo.description') }}</p>
      </BaseAlert>
    </template>

    <form class="login-page__form" novalidate @submit.prevent="submit">
      <BaseAlert
        v-if="route.query.registration === 'check-email'"
        variant="success"
        :title="t('auth.confirmation.title')"
      >
        {{ t('auth.confirmation.description') }}
      </BaseAlert>
      <BaseAlert
        v-if="submitError"
        variant="error"
        :title="t('auth.errors.title')"
      >
        {{ submitError }}
      </BaseAlert>
      <BaseInput
        v-model="form.email"
        type="email"
        name="email"
        autocomplete="email"
        required
        :label="t('auth.fields.email')"
        :placeholder="t('auth.fields.emailPlaceholder')"
        :error="errors.email ?? ''"
      />
      <BaseInput
        v-model="form.password"
        :type="passwordVisible ? 'text' : 'password'"
        name="password"
        autocomplete="current-password"
        required
        :label="t('auth.fields.password')"
        :placeholder="t('auth.fields.passwordPlaceholder')"
        :error="errors.password ?? ''"
      >
        <template #trailing>
          <button type="button" :aria-label="t(passwordVisible ? 'auth.fields.hidePassword' : 'auth.fields.showPassword')" @click="passwordVisible = !passwordVisible">
            <EyeOff v-if="passwordVisible" :size="19" aria-hidden="true" />
            <Eye v-else :size="19" aria-hidden="true" />
          </button>
        </template>
      </BaseInput>
      <NuxtLink class="login-page__forgot" :to="getAppRoute('forgotPassword', locale)">
        {{ t('auth.login.forgotPassword') }}
      </NuxtLink>
      <BaseButton
        block
        size="lg"
        type="submit"
        :loading="authStore.status === 'loading'"
      >
        {{ t('auth.login.submit') }}
      </BaseButton>
      <p class="login-page__switch">
        {{ t('auth.login.noAccount') }}
        <NuxtLink :to="getAppRoute('register', locale)">
          {{ t('auth.login.register') }}
        </NuxtLink>
      </p>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import AuthShell from '~/components/auth/AuthShell.vue'
import { createLoginSchema } from '~/schemas/validation'
import { useAuthStore } from '~/stores/auth'
import { getAppRoute, getRoleDashboardRoute } from '~/utils/routes'
import { getFieldErrors } from '~/utils/validation'

definePageMeta({
  middleware: ['guest'],
})

defineI18nRoute({
  paths: {
    hr: '/prijava',
    en: '/login',
  },
})

const { t, locale } = useI18n()
const authStore = useAuthStore()
const route = useRoute()
const isMockMode = useRuntimeConfig().public.infrastructureMode === 'mock'
const form = reactive({
  email: '',
  password: '',
})
const passwordVisible = ref(false)
const errors = ref<Record<string, string>>({})
const submitError = computed(() => authStore.errorCode
  ? t(`auth.errors.${authStore.errorCode}`)
  : '')

const submit = async () => {
  if (authStore.status === 'loading') return
  authStore.clearError()
  const result = createLoginSchema(t).safeParse(form)
  if (!result.success) {
    errors.value = getFieldErrors(result.error)
    return
  }

  errors.value = {}
  const success = await authStore.login(result.data)
  if (success && authStore.user) {
    await navigateTo(getRoleDashboardRoute(authStore.user.role, locale.value))
  }
}

usePublicSeo({
  title: computed(() => t('auth.login.metaTitle')),
  description: computed(() => t('auth.login.metaDescription')),
  path: computed(() => getAppRoute('login', locale.value)),
})
</script>

<style scoped lang="scss">
.login-page {
  &__form {
    display: grid;
    gap: $space-5;
  }

  &__forgot {
    width: fit-content;
    margin-left: auto;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-primary;
  }

  &__switch {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-align: center;

    a {
      font-weight: $font-weight-semibold;
      color: $color-primary;
    }
  }
}
</style>
