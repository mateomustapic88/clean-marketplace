<template>
  <div class="cleaner-onboarding">
    <div class="cleaner-onboarding__container container">
      <header><DemoBadge v-if="isMockMode" type="profile" /><h1>{{ t('cleaner.onboarding.title') }}</h1><p>{{ t('cleaner.onboarding.description') }}</p></header><WizardStepper :steps="steps" :current="current" :label="t('cleaner.onboarding.progress')" @select="current = $event" /><BaseCard v-if="profile">
        <form @submit.prevent="next">
          <fieldset v-show="current === 0"><legend>{{ steps[0] }}</legend><div class="cleaner-onboarding__grid"><BaseInput v-model="draft.firstName" required :label="t('auth.fields.firstName')" /><BaseInput v-model="draft.lastName" required :label="t('auth.fields.lastName')" /><BaseInput v-model="draft.phone" required type="tel" :label="t('auth.fields.phone')" /><BaseSelect v-model="draft.cityCode" required :label="t('auth.fields.city')" :options="cityOptions" /></div></fieldset>
          <fieldset v-show="current === 1"><legend>{{ steps[1] }}</legend><BaseTextarea v-model="draft.biography" required :label="t('cleaner.profile.biography')" /><div class="cleaner-onboarding__grid"><BaseInput v-model.number="draft.yearsOfExperience" type="number" :label="t('cleaner.profile.experience')" /><BaseInput v-model.number="draft.hourlyRate" type="number" :label="t('cleaner.profile.hourlyRate')" /><BaseInput v-model.number="draft.minimumJobPrice" type="number" :label="t('cleaner.profile.minimumPrice')" /><BaseInput v-model.number="draft.serviceRadiusKm" type="number" :label="t('cleaner.profile.radius')" /></div></fieldset>
          <fieldset v-show="current === 2"><legend>{{ steps[2] }}</legend><div class="cleaner-onboarding__checks"><label v-for="city in userStore.cities" :key="city.code"><input type="checkbox" :checked="serviceCities.includes(city.code)" @change="toggleCity(city.code)">{{ city.name }}</label></div></fieldset>
          <fieldset v-show="current === 3"><legend>{{ steps[3] }}</legend><CleanerAvailability v-model="draft.availability" v-model:vacation="draft.vacationMode" /></fieldset>
          <fieldset v-show="current === 4"><legend>{{ steps[4] }}</legend><h2>{{ draft.firstName }} {{ draft.lastName }}</h2><p>{{ draft.biography }}</p></fieldset>
          <BaseAlert v-if="error" variant="error">{{ error }}</BaseAlert><div class="cleaner-onboarding__actions"><BaseButton v-if="current" type="button" variant="secondary" :disabled="submitting" @click="current--">{{ t('common.previous') }}</BaseButton><span /><BaseButton type="submit" :loading="submitting">{{ current === 4 ? t('cleaner.onboarding.finish') : t('common.next') }}</BaseButton></div>
        </form>
      </BaseCard>
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

definePageMeta({ middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/onboarding/cistac', en: '/onboarding/cleaner', sl: '/uvajanje/cistilec' } })
const { t, locale } = useI18n()
const isMockMode = useRuntimeConfig().public.infrastructureMode === 'mock'
const authStore = useAuthStore(), userStore = useUserStore()
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? userStore.profile as CleanerProfile : null)
const draft = reactive({} as CleanerProfile)
const serviceCities = ref<string[]>([]), current = ref(0), error = ref('')
const submitting = ref(false)
const steps = computed(() => ['personal', 'professional', 'areas', 'availability', 'finish'].map((key) => t(`cleaner.onboarding.steps.${key}`)))
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([userStore.loadCurrentProfile(id), userStore.loadDirectory()])
  if (profile.value) {
    Object.assign(draft, normalizeCleanerProfile(profile.value))
    serviceCities.value = draft.serviceAreas.map((area) => area.cityCode)
  }
}
watch(() => authStore.user?.id, load, { immediate: true })
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name })))
const toggleCity = (code: string) => serviceCities.value = serviceCities.value.includes(code) ? serviceCities.value.filter((item) => item !== code) : [...serviceCities.value, code]
const next = async () => {
  if (submitting.value) return
  if (current.value < 4) {
    current.value++
    return
  }
  const result = createCleanerProfileSchema(t).safeParse(draft)
  if (!result.success || !serviceCities.value.length) {
    error.value = t('cleaner.onboarding.validation')
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
    error.value = t('common.actionError')
  }
  finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.cleaner-onboarding { min-height: 100vh; padding-block: $space-8 $space-16; background: $color-background; &__container, form, fieldset { display: grid; gap: $space-6; } &__container { max-width: 64rem; } header h1 { margin-block: $space-3; font-size: $font-size-3xl; } fieldset { padding: 0; border: 0; } legend { margin-bottom: $space-4; font-size: $font-size-xl; font-weight: $font-weight-bold; } &__grid, &__checks { display: grid; gap: $space-4; } &__checks label { display: flex; gap: $space-2; } &__actions { display: flex; gap: $space-3; & span { flex: 1; } } @media (min-width: $breakpoint-md) { &__grid, &__checks { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>
