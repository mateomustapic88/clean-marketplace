<template>
  <AuthShell
    :eyebrow="t('auth.register.eyebrow')"
    :title="t('auth.register.title')"
    :description="t('auth.register.description')"
  >
    <form class="register-page__form" novalidate @submit.prevent="submit">
      <BaseAlert
        v-if="submitError"
        variant="error"
        :title="t('auth.errors.title')"
      >
        {{ submitError }}
      </BaseAlert>
      <fieldset class="register-page__roles">
        <legend>{{ t('auth.register.roleLegend') }}</legend>
        <label class="register-page__role" :class="{ 'register-page__role--active': form.role === 'owner' }">
          <input v-model="form.role" type="radio" name="role" value="owner">
          <Home :size="24" aria-hidden="true" />
          <span><strong>{{ t('auth.register.ownerRole') }}</strong><small>{{ t('auth.register.ownerRoleDescription') }}</small></span>
        </label>
        <label class="register-page__role" :class="{ 'register-page__role--active': form.role === 'cleaner' }">
          <input v-model="form.role" type="radio" name="role" value="cleaner">
          <Sparkles :size="24" aria-hidden="true" />
          <span><strong>{{ t('auth.register.cleanerRole') }}</strong><small>{{ t('auth.register.cleanerRoleDescription') }}</small></span>
        </label>
        <p v-if="errors.role" class="register-page__error" role="alert">
          {{ errors.role }}
        </p>
      </fieldset>
      <div class="register-page__grid">
        <BaseInput
          v-model="form.firstName"
          name="firstName"
          autocomplete="given-name"
          required
          :label="t('auth.fields.firstName')"
          :error="errors.firstName ?? ''"
        />
        <BaseInput
          v-model="form.lastName"
          name="lastName"
          autocomplete="family-name"
          required
          :label="t('auth.fields.lastName')"
          :error="errors.lastName ?? ''"
        />
        <BaseInput
          v-model="form.email"
          type="email"
          name="email"
          autocomplete="email"
          required
          :label="t('auth.fields.email')"
          :error="errors.email ?? ''"
        />
        <BaseInput
          v-model="form.phone"
          type="tel"
          name="phone"
          autocomplete="tel"
          required
          :label="t('auth.fields.phone')"
          :error="errors.phone ?? ''"
        />
        <BaseSelect
          v-model="form.cityCode"
          name="cityCode"
          required
          :label="t('auth.fields.city')"
          :placeholder="t('auth.fields.cityPlaceholder')"
          :options="cityOptions"
          :error="errors.cityCode ?? ''"
        />
        <BaseInput
          v-model="form.password"
          :type="passwordVisible ? 'text' : 'password'"
          name="password"
          autocomplete="new-password"
          required
          :label="t('auth.fields.password')"
          :hint="t('auth.register.passwordHint')"
          :error="errors.password ?? ''"
        >
          <template #trailing>
            <button type="button" :aria-label="t(passwordVisible ? 'auth.fields.hidePassword' : 'auth.fields.showPassword')" @click="passwordVisible = !passwordVisible">
              <EyeOff v-if="passwordVisible" :size="19" aria-hidden="true" />
              <Eye v-else :size="19" aria-hidden="true" />
            </button>
          </template>
        </BaseInput>
      </div>
      <BaseButton
        block
        size="lg"
        type="submit"
        :loading="authStore.status === 'loading'"
      >
        {{ t('auth.register.submit') }}
      </BaseButton>
      <p class="register-page__switch">
        {{ t('auth.register.hasAccount') }}
        <NuxtLink :to="getAppRoute('login', locale)">
          {{ t('auth.register.login') }}
        </NuxtLink>
      </p>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { Eye, EyeOff, Home, Sparkles } from '@lucide/vue'
import AuthShell from '~/components/auth/AuthShell.vue'
import { createRegisterSchema } from '~/schemas/validation'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { getAppRoute, getRoleOnboardingRoute } from '~/utils/routes'
import { getFieldErrors } from '~/utils/validation'

definePageMeta({
  middleware: ['guest'],
})

defineI18nRoute({
  paths: {
    hr: '/registracija',
    en: '/register',
    sl: '/registracija',
  },
})

const { t, locale } = useI18n()
const authStore = useAuthStore()
const userStore = useUserStore()
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  cityCode: '',
  role: 'owner' as 'owner' | 'cleaner',
})
const passwordVisible = ref(false)
const errors = ref<Record<string, string>>({})
const submitError = computed(() => authStore.errorCode
  ? t(`auth.errors.${authStore.errorCode}`)
  : '')
const cityOptions = computed(() => userStore.cities.map((city) => ({
  label: city.name,
  value: city.code,
})))

onMounted(() => userStore.loadDirectory())

const submit = async () => {
  if (authStore.status === 'loading') return
  authStore.clearError()
  const result = createRegisterSchema(t).safeParse(form)
  if (!result.success) {
    errors.value = getFieldErrors(result.error)
    return
  }

  errors.value = {}
  const success = await authStore.register(result.data)
  if (success) {
    await navigateTo(authStore.registrationPending
      ? `${getAppRoute('login', locale.value)}?registration=check-email`
      : getRoleOnboardingRoute(result.data.role, locale.value))
  }
}

usePublicSeo({
  title: computed(() => t('auth.register.metaTitle')),
  description: computed(() => t('auth.register.metaDescription')),
  path: computed(() => getAppRoute('register', locale.value)),
})
</script>

<style scoped lang="scss">
.register-page {
  &__form {
    display: grid;
    gap: $space-6;
  }

  &__roles {
    display: grid;
    gap: $space-4;
    padding: $space-5;
    border: 1px solid $color-border;
    border-radius: $radius-lg;

    legend {
      padding-inline: $space-2;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }
  }

  &__role {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: $space-3;
    align-items: center;
    min-height: 5.5rem;
    padding: $space-4;
    cursor: pointer;
    border: 1px solid $color-border;
    border-radius: $radius-lg;

    input {
      position: absolute;
      opacity: 0;
    }

    svg {
      color: $color-primary;
    }

    span {
      display: grid;
      gap: $space-1;
    }

    small {
      color: $color-text-secondary;
    }

    &:focus-within {
      @include focus-ring;
    }

    &--active {
      background: $color-primary-light;
      border-color: $color-primary;
    }
  }

  &__grid {
    display: grid;
    gap: $space-5;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-error;
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

@media (min-width: $breakpoint-md) {
  .register-page {
    &__grid {
      grid-template-columns: 1fr 1fr;
    }
  }
}
</style>
