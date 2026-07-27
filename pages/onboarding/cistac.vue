<template>
  <div class="cleaner-onboarding">
    <div class="cleaner-onboarding__container container">
      <header>
        <DemoBadge v-if="isMockMode" type="profile" />
        <h1>{{ t('cleaner.onboarding.title') }}</h1>
        <p>{{ t('cleaner.onboarding.description') }}</p>
      </header>
      <BaseAlert
        v-if="route.query.reason === 'profile_required'"
        variant="info"
        :title="t('profileCompletion.requiredTitle')"
      >
        {{ t('profileCompletion.requiredDescription') }}
      </BaseAlert>
      <WizardStepper
        :steps="steps"
        :current="current"
        :label="t('cleaner.onboarding.progress')"
        @select="goTo"
      />
      <BaseCard v-if="profile">
        <form novalidate @submit.prevent="next">
          <fieldset v-show="current === 0">
            <legend tabindex="-1">{{ steps[0] }}</legend>
            <div class="cleaner-onboarding__grid">
              <BaseInput
                v-model="draft.firstName"
                name="firstName"
                required
                :label="t('auth.fields.firstName')"
                :error="fieldErrors.firstName ?? ''"
              />
              <BaseInput
                v-model="draft.lastName"
                name="lastName"
                required
                :label="t('auth.fields.lastName')"
                :error="fieldErrors.lastName ?? ''"
              />
              <BaseInput
                v-model="draft.phone"
                name="phone"
                required
                type="tel"
                :label="t('auth.fields.phone')"
                :error="fieldErrors.phone ?? ''"
              />
              <BaseSelect
                v-model="draft.cityCode"
                name="cityCode"
                required
                :label="t('auth.fields.city')"
                :options="cityOptions"
                :error="fieldErrors.cityCode ?? ''"
              />
            </div>
          </fieldset>

          <fieldset v-show="current === 1">
            <legend tabindex="-1">{{ steps[1] }}</legend>
            <BaseTextarea
              v-model="draft.biography"
              name="biography"
              required
              :maxlength="600"
              :label="t('cleaner.profile.biography')"
              :hint="t('cleaner.onboarding.biographyHint')"
              :error="fieldErrors.biography ?? ''"
            />
            <div class="cleaner-onboarding__grid">
              <BaseInput
                v-model.number="draft.yearsOfExperience"
                name="yearsOfExperience"
                required
                type="number"
                :label="t('cleaner.profile.experience')"
                :error="fieldErrors.yearsOfExperience ?? ''"
              />
              <BaseInput
                v-model.number="draft.hourlyRate"
                name="hourlyRate"
                required
                type="number"
                :label="t('cleaner.profile.hourlyRate')"
                :error="fieldErrors.hourlyRate ?? ''"
              />
              <BaseInput
                v-model.number="draft.minimumJobPrice"
                name="minimumJobPrice"
                required
                type="number"
                :label="t('cleaner.profile.minimumPrice')"
                :error="fieldErrors.minimumJobPrice ?? ''"
              />
              <BaseInput
                v-model.number="draft.serviceRadiusKm"
                name="serviceRadiusKm"
                required
                type="number"
                :label="t('cleaner.profile.radius')"
                :error="fieldErrors.serviceRadiusKm ?? ''"
              />
            </div>
            <fieldset
              class="cleaner-onboarding__languages"
              tabindex="-1"
              :aria-invalid="Boolean(fieldErrors.languages)"
              :aria-describedby="fieldErrors.languages ? 'cleaner-languages-error' : undefined"
            >
              <legend>{{ t('cleaner.profile.languages') }} *</legend>
              <label v-for="language in availableLanguages" :key="language">
                <input
                  type="checkbox"
                  :checked="draft.languages.includes(language)"
                  @change="toggleLanguage(language)"
                >
                {{ t(`languages.${language}`) }}
              </label>
              <p
                v-if="fieldErrors.languages"
                id="cleaner-languages-error"
                class="cleaner-onboarding__field-error"
                role="alert"
              >
                {{ fieldErrors.languages }}
              </p>
            </fieldset>
          </fieldset>

          <fieldset v-show="current === 2">
            <legend tabindex="-1">{{ steps[2] }} *</legend>
            <div
              class="cleaner-onboarding__checks"
              role="group"
              tabindex="-1"
              :aria-invalid="Boolean(serviceAreaError)"
              :aria-describedby="serviceAreaError ? 'cleaner-service-areas-error' : undefined"
            >
              <label v-for="city in userStore.cities" :key="city.code">
                <input
                  type="checkbox"
                  :checked="serviceCities.includes(city.code)"
                  @change="toggleCity(city.code)"
                >
                {{ city.name }}
              </label>
            </div>
            <p
              v-if="serviceAreaError"
              id="cleaner-service-areas-error"
              class="cleaner-onboarding__field-error"
              role="alert"
            >
              {{ serviceAreaError }}
            </p>
          </fieldset>

          <fieldset v-show="current === 3">
            <legend tabindex="-1">{{ steps[3] }}</legend>
            <CleanerAvailability
              v-model="draft.availability"
              v-model:vacation="draft.vacationMode"
            />
          </fieldset>

          <fieldset v-show="current === 4">
            <legend tabindex="-1">{{ steps[4] }}</legend>
            <h2>{{ draft.firstName }} {{ draft.lastName }}</h2>
            <p>{{ draft.biography }}</p>
          </fieldset>

          <BaseAlert v-if="error" variant="error">
            {{ error }}
          </BaseAlert>
          <div class="cleaner-onboarding__actions">
            <BaseButton
              v-if="current"
              type="button"
              variant="secondary"
              :disabled="submitting"
              @click="goTo(current - 1)"
            >
              {{ t('common.previous') }}
            </BaseButton>
            <span />
            <BaseButton type="submit" :loading="submitting">
              {{ current === 4 ? t('cleaner.onboarding.finish') : t('common.next') }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>
      <BaseAlert v-else-if="loadError" variant="error">{{ t('common.actionError') }}</BaseAlert>
      <p v-else class="cleaner-onboarding__loading" role="status">{{ t('common.loading') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CleanerProfile } from '~/domains/users/types'
import { createCleanerProfileSchema } from '~/schemas/validation'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { normalizeCleanerProfile } from '~/utils/cleaner'
import { getAppRoute } from '~/utils/routes'
import { getFieldErrors } from '~/utils/validation'

definePageMeta({ middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/onboarding/cistac', en: '/onboarding/cleaner', sl: '/uvajanje/cistilec' } })
const { t, locale } = useI18n()
const route = useRoute()
const isMockMode = useRuntimeConfig().public.infrastructureMode === 'mock'
const authStore = useAuthStore(), userStore = useUserStore()
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? userStore.profile as CleanerProfile : null)
const draft = reactive({ languages: [] } as unknown as CleanerProfile)
const serviceCities = ref<string[]>([]), current = ref(0), error = ref('')
const fieldErrors = ref<Record<string, string>>({})
const serviceAreaError = ref('')
const submitting = ref(false)
const loadError = ref(false)
const availableLanguages = ['hr', 'en', 'sl', 'de', 'it']
const steps = computed(() => ['personal', 'professional', 'areas', 'availability', 'finish'].map((key) => t(`cleaner.onboarding.steps.${key}`)))
const fieldsByStep = [
  ['firstName', 'lastName', 'phone', 'cityCode'],
  ['biography', 'yearsOfExperience', 'hourlyRate', 'minimumJobPrice', 'serviceRadiusKm', 'languages'],
] as const

const focusStep = async () => {
  await nextTick()
  document.querySelector<HTMLElement>('.cleaner-onboarding fieldset:not([style*="display: none"]) legend')?.focus()
}

const focusFirstError = async () => {
  await nextTick()
  document.querySelector<HTMLElement>('.cleaner-onboarding [aria-invalid="true"]')?.focus()
}

const load = async (id?: string) => {
  if (!id) return
  loadError.value = false
  try {
    await Promise.all([userStore.loadCurrentProfile(id), userStore.loadDirectory()])
    if (!profile.value) {
      loadError.value = true
      return
    }
    Object.assign(draft, normalizeCleanerProfile(profile.value))
    serviceCities.value = draft.serviceAreas.length
      ? draft.serviceAreas.map((area) => area.cityCode)
      : draft.cityCode
        ? [draft.cityCode]
        : []
  }
  catch {
    loadError.value = true
  }
}
watch(() => authStore.user?.id, load, { immediate: true })
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name })))
const toggleCity = (code: string) => {
  serviceCities.value = serviceCities.value.includes(code)
    ? serviceCities.value.filter((item) => item !== code)
    : [...serviceCities.value, code]
  if (serviceCities.value.length) serviceAreaError.value = ''
}
const toggleLanguage = (language: string) => {
  draft.languages = draft.languages.includes(language)
    ? draft.languages.filter((item) => item !== language)
    : [...draft.languages, language]
  if (draft.languages.length) fieldErrors.value.languages = ''
}

const schemaErrors = () => {
  const result = createCleanerProfileSchema(t).safeParse(draft)
  return result.success ? {} : getFieldErrors(result.error)
}

const validateStep = async (step: number) => {
  error.value = ''
  if (step === 2) {
    serviceAreaError.value = serviceCities.value.length
      ? ''
      : t('cleaner.onboarding.serviceAreasRequired')
    if (serviceAreaError.value) {
      error.value = t('cleaner.onboarding.validation')
      await focusFirstError()
      return false
    }
    return true
  }
  const fields = fieldsByStep[step]
  if (!fields) return true
  const errors = schemaErrors()
  for (const field of fields) {
    if (errors[field]) fieldErrors.value[field] = errors[field]
    else fieldErrors.value[field] = ''
  }
  if (fields.some((field) => fieldErrors.value[field])) {
    error.value = t('cleaner.onboarding.validation')
    await focusFirstError()
    return false
  }
  return true
}

const goTo = async (step: number) => {
  if (submitting.value || step === current.value) return
  if (step < current.value) {
    current.value = step
    error.value = ''
    await focusStep()
    return
  }
  if (step === current.value + 1 && await validateStep(current.value)) {
    current.value = step
    await focusStep()
  }
}

const next = async () => {
  if (submitting.value) return
  if (current.value < 4) {
    if (!await validateStep(current.value)) return
    current.value++
    await focusStep()
    return
  }
  const result = createCleanerProfileSchema(t).safeParse(draft)
  if (!result.success || !serviceCities.value.length) {
    fieldErrors.value = result.success ? {} : getFieldErrors(result.error)
    serviceAreaError.value = serviceCities.value.length
      ? ''
      : t('cleaner.onboarding.serviceAreasRequired')
    const invalidSteps = [
      ...Object.keys(fieldErrors.value).map((field) =>
        fieldsByStep.findIndex((fields) => fields.some((candidate) => candidate === field))),
      ...(serviceAreaError.value ? [2] : []),
    ].filter((step) => step >= 0)
    current.value = invalidSteps.length ? Math.min(...invalidSteps) : 0
    error.value = t('cleaner.onboarding.validation')
    await focusFirstError()
    return
  }
  submitting.value = true
  try {
    draft.serviceAreas = serviceCities.value.map((cityCode) => ({ cityCode, radiusKm: draft.serviceRadiusKm }))
    draft.onboardingCompleted = true
    await userStore.updateCleaner({ ...draft })
    await navigateTo(getAppRoute('cleanerDashboard', locale.value))
  }
  catch {
    error.value = t('cleaner.onboarding.saveError')
  }
  finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.cleaner-onboarding {
  min-height: 100vh;
  padding-block: $space-8 $space-16;
  background: $color-background;

  &__container,
  form,
  fieldset {
    display: grid;
    gap: $space-6;
  }

  &__container {
    max-width: 64rem;
  }

  header h1 {
    margin-block: $space-3;
    font-size: $font-size-3xl;
  }

  fieldset {
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: $space-4;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
  }

  &__grid,
  &__checks,
  &__languages {
    display: grid;
    gap: $space-4;
  }

  &__checks label,
  &__languages label {
    display: flex;
    gap: $space-2;
    align-items: center;
  }

  &__languages {
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    padding: $space-4;
    border: 1px solid $color-border;
    border-radius: $radius-md;
  }

  &__languages legend {
    padding-inline: $space-2;
    font-size: $font-size-md;
  }

  &__field-error {
    grid-column: 1 / -1;
    font-size: $font-size-xs;
    color: $color-error;
  }

  &__loading {
    color: $color-text-secondary;
  }

  &__actions {
    display: flex;
    gap: $space-3;

    & span {
      flex: 1;
    }
  }

  @media (min-width: $breakpoint-md) {
    &__grid,
    &__checks {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
