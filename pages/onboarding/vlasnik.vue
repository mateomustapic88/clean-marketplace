<template>
  <div class="owner-onboarding">
    <div class="owner-onboarding__container container">
      <header><DemoBadge v-if="isMockMode" type="profile" /><h1>{{ t('owner.onboarding.title') }}</h1><p>{{ t('owner.onboarding.description') }}</p></header>
      <WizardStepper :steps="steps" :current="current" :label="t('owner.onboarding.progress')" @select="goTo" />
      <AutosaveIndicator :status="saveStatus" />
      <BaseCard>
        <form novalidate @submit.prevent="next">
          <fieldset v-show="current === 0"><legend ref="stepHeading" tabindex="-1">{{ steps[0] }}</legend><div class="owner-onboarding__grid"><BaseInput v-model="draft.firstName" required :label="t('auth.fields.firstName')" /><BaseInput v-model="draft.lastName" required :label="t('auth.fields.lastName')" /></div></fieldset>
          <fieldset v-show="current === 1"><legend tabindex="-1">{{ steps[1] }}</legend><div class="owner-onboarding__grid"><BaseInput v-model="draft.phone" type="tel" required :label="t('auth.fields.phone')" /><BaseSelect v-model="draft.cityCode" required :label="t('auth.fields.city')" :options="cityOptions" /><BaseSelect v-model="draft.preferredContactMethod" :label="t('owner.profile.contactMethod')" :options="contactOptions" /></div></fieldset>
          <fieldset v-show="current === 2"><legend tabindex="-1">{{ steps[2] }}</legend><div class="owner-onboarding__grid"><BaseInput v-model="draft.apartmentName" required :label="t('owner.job.fields.apartmentName')" /><BaseSelect v-model="draft.apartmentCityCode" required :label="t('catalog.city')" :options="cityOptions" /><BaseInput v-model="draft.apartmentAddress" required :label="t('owner.job.fields.address')" /></div></fieldset>
          <fieldset v-show="current === 3"><legend tabindex="-1">{{ steps[3] }}</legend><div class="owner-onboarding__grid"><BaseSelect v-model="draft.preferredLanguage" :label="t('owner.profile.language')" :options="languageOptions" /><BaseSelect v-model="draft.timeZone" :label="t('owner.profile.timeZone')" :options="timeZoneOptions" /><BaseInput v-model="draft.companyName" :label="t('owner.profile.company')" /><BaseInput v-model="draft.agencyName" :label="t('owner.profile.agency')" /></div></fieldset>
          <fieldset v-show="current === 4"><legend tabindex="-1">{{ steps[4] }}</legend><div class="owner-onboarding__summary"><h2>{{ draft.firstName }} {{ draft.lastName }}</h2><p>{{ draft.apartmentName }} · {{ cityName(draft.apartmentCityCode) }}</p><p>{{ t('owner.onboarding.finishDescription') }}</p></div></fieldset>
          <BaseAlert v-if="error" variant="error">{{ error }}</BaseAlert>
          <div class="owner-onboarding__actions"><BaseButton v-if="current > 0" type="button" variant="secondary" :disabled="submitting" @click="goTo(current - 1)">{{ t('common.previous') }}</BaseButton><span /><BaseButton type="submit" :loading="submitting">{{ current === 4 ? t('owner.onboarding.finish') : t('common.next') }}</BaseButton></div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OwnerProfile } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { getAppRoute } from '~/utils/routes'

definePageMeta({ middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/onboarding/vlasnik', en: '/onboarding/owner' } })
const { t, locale } = useI18n(), authStore = useAuthStore(), userStore = useUserStore()
const isMockMode = useRuntimeConfig().public.infrastructureMode === 'mock'
const profile = computed(() => userStore.profile as OwnerProfile | null)
const draft = reactive({ firstName: profile.value?.firstName ?? '', lastName: profile.value?.lastName ?? '', phone: profile.value?.phone ?? '', cityCode: profile.value?.cityCode ?? '', preferredContactMethod: profile.value?.preferredContactMethod ?? 'email', companyName: profile.value?.companyName ?? '', agencyName: profile.value?.agencyName ?? '', preferredLanguage: profile.value?.preferredLanguage ?? 'hr', timeZone: profile.value?.timeZone ?? 'Europe/Zagreb', apartmentName: profile.value?.apartmentName ?? '', apartmentCityCode: profile.value?.apartmentCityCode ?? '', apartmentAddress: profile.value?.apartmentAddress ?? '' })
const current = ref(0), saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved'), error = ref('')
const submitting = ref(false)
const steps = computed(() => ['personal', 'contact', 'apartment', 'preferences', 'finish'].map((key) => t(`owner.onboarding.steps.${key}`)))
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name }))), contactOptions = computed(() => ['email', 'phone', 'sms'].map((value) => ({ value, label: t(`owner.profile.contact.${value}`) }))), languageOptions = computed(() => ['hr', 'en'].map((value) => ({ value, label: t(`languages.${value}`) }))), timeZoneOptions = ['Europe/Zagreb', 'Europe/London', 'Europe/Berlin'].map((value) => ({ value, label: value }))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const ownerFromDraft = (onboardingCompleted: boolean): OwnerProfile | null => profile.value
  ? {
      ...profile.value,
      ...draft,
      companyName: draft.companyName || null,
      agencyName: draft.agencyName || null,
      preferredContactMethod: draft.preferredContactMethod as OwnerProfile['preferredContactMethod'],
      preferredLanguage: draft.preferredLanguage as 'hr' | 'en',
      avatarUrl: profile.value.avatarUrl ?? null,
      onboardingCompleted,
      apartmentName: draft.apartmentName,
      apartmentCityCode: draft.apartmentCityCode,
      apartmentAddress: draft.apartmentAddress,
    }
  : null
const loadOwnerOnboarding = async (userId?: string) => {
  if (!userId) return
  await Promise.all([
    userStore.loadCurrentProfile(userId),
    userStore.loadDirectory(),
  ])
  if (!profile.value) return
  Object.assign(draft, {
    firstName: profile.value.firstName,
    lastName: profile.value.lastName,
    phone: profile.value.phone,
    cityCode: profile.value.cityCode,
    preferredContactMethod: profile.value.preferredContactMethod,
    companyName: profile.value.companyName ?? '',
    agencyName: profile.value.agencyName ?? '',
    preferredLanguage: profile.value.preferredLanguage ?? 'hr',
    timeZone: profile.value.timeZone ?? 'Europe/Zagreb',
    apartmentName: profile.value.apartmentName ?? '',
    apartmentCityCode: profile.value.apartmentCityCode ?? '',
    apartmentAddress: profile.value.apartmentAddress ?? '',
  })
}
watch(() => authStore.user?.id, loadOwnerOnboarding, { immediate: true })
watch(draft, () => {
  saveStatus.value = 'unsaved'
}, { deep: true })
const persist = async () => {
  if (!import.meta.client || saveStatus.value !== 'unsaved') return
  saveStatus.value = 'saving'
  try {
    const owner = ownerFromDraft(false)
    if (!owner) return
    await userStore.updateOwner(owner)
    saveStatus.value = 'saved'
  }
  catch {
    saveStatus.value = 'unsaved'
  }
}
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => void persist(), 2000)
})
onBeforeUnmount(() => clearInterval(timer))
const goTo = async (step: number) => {
  current.value = step
  await nextTick()
  document.querySelector<HTMLElement>('.owner-onboarding fieldset:not([style*="display: none"]) legend')?.focus()
}
const validCurrent = () => current.value === 0 ? draft.firstName && draft.lastName : current.value === 1 ? draft.phone && draft.cityCode : current.value === 2 ? draft.apartmentName && draft.apartmentCityCode && draft.apartmentAddress : true
const next = async () => {
  if (submitting.value) return
  if (!validCurrent()) {
    error.value = t('validation.required')
    return
  }
  error.value = ''
  if (current.value < 4) {
    await goTo(current.value + 1)
    return
  }
  if (!profile.value) return
  submitting.value = true
  try {
    const owner = ownerFromDraft(true)
    if (!owner) return
    await userStore.updateOwner(owner)
    await navigateTo(getAppRoute('ownerDashboard', locale.value))
  }
  catch {
    error.value = t('common.actionError')
  }
  finally {
    submitting.value = false
  }
}
useSeoMeta({ title: () => t('owner.onboarding.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-onboarding { min-height: 100vh; padding-block: $space-8 $space-16; background: $color-background;
  &__container { display: grid; gap: $space-6; max-width: 60rem; } header h1 { margin-block: $space-3; font-size: $font-size-3xl; } header p { color: $color-text-secondary; }
  form, fieldset { display: grid; gap: $space-5; } fieldset { padding: 0; border: 0; } legend { margin-bottom: $space-5; font-size: $font-size-xl; font-weight: $font-weight-bold; outline: none; }
  &__grid { display: grid; gap: $space-4; } &__summary { display: grid; gap: $space-3; }
  &__actions { display: flex; gap: $space-3; padding-top: $space-5; border-top: 1px solid $color-border; } &__actions span { flex: 1; }
  @media (min-width: $breakpoint-md) { &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
}
</style>
