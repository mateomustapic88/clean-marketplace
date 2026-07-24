<template>
  <div class="cleaner-profile-page">
    <header><h1>{{ t('cleaner.profile.title') }}</h1><p>{{ t('cleaner.profile.description') }}</p></header>
    <BaseAlert v-if="saved" variant="success">{{ t('cleaner.profile.saved') }}</BaseAlert>
    <BaseAlert v-if="actionError" variant="error">{{ t('common.actionError') }}</BaseAlert>
    <BaseCard v-if="profile">
      <form novalidate @submit.prevent="save">
        <div class="cleaner-profile-page__avatar"><BaseAvatar :name="`${form.firstName} ${form.lastName}`" size="lg" /><label>{{ t('cleaner.profile.avatar') }}<input type="file" accept=".jpg,.jpeg,.png,.webp" @change="uploadAvatar"></label></div>
        <div class="cleaner-profile-page__grid">
          <BaseInput v-model="form.firstName" required :label="t('auth.fields.firstName')" :error="errors.firstName ?? ''" />
          <BaseInput v-model="form.lastName" required :label="t('auth.fields.lastName')" :error="errors.lastName ?? ''" />
          <BaseInput v-model="email" type="email" required :label="t('auth.fields.email')" :error="errors.email ?? ''" />
          <BaseInput v-model="form.phone" type="tel" required :label="t('auth.fields.phone')" :error="errors.phone ?? ''" />
          <BaseSelect v-model="form.cityCode" required :label="t('auth.fields.city')" :options="cityOptions" />
          <BaseInput v-model.number="form.yearsOfExperience" type="number" required :label="t('cleaner.profile.experience')" />
          <BaseInput v-model.number="form.hourlyRate" type="number" required :label="t('cleaner.profile.hourlyRate')" />
          <BaseInput v-model.number="form.minimumJobPrice" type="number" required :label="t('cleaner.profile.minimumPrice')" />
          <BaseInput v-model.number="form.serviceRadiusKm" type="number" required :label="t('cleaner.profile.radius')" />
        </div>
        <BaseTextarea v-model="form.biography" required :label="t('cleaner.profile.biography')" :error="errors.biography ?? ''" />
        <fieldset><legend>{{ t('cleaner.profile.availableCities') }}</legend><label v-for="city in userStore.cities" :key="city.code"><input type="checkbox" :checked="serviceCities.includes(city.code)" @change="toggleCity(city.code)">{{ city.name }}</label></fieldset>
        <fieldset><legend>{{ t('cleaner.profile.languages') }}</legend><label v-for="language in ['hr', 'en', 'de', 'it']" :key="language"><input type="checkbox" :checked="form.languages.includes(language)" @change="toggleLanguage(language)">{{ t(`languages.${language}`) }}</label></fieldset>
        <div class="cleaner-profile-page__checks"><BaseCheckbox v-model="form.ownTransportation" :label="t('cleaner.profile.transport')" /><BaseCheckbox v-model="form.bringsSupplies" :label="t('cleaner.profile.supplies')" /><BaseCheckbox v-model="form.weekendAvailable" :label="t('cleaner.profile.weekend')" /><BaseCheckbox v-model="form.sameDayAvailable" :label="t('cleaner.profile.sameDay')" /></div>
        <BaseButton type="submit" :loading="saving">{{ t('cleaner.profile.save') }}</BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { CleanerProfile } from '~/domains/users/types'
import { createCleanerProfileSchema } from '~/schemas/validation'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { normalizeCleanerProfile } from '~/utils/cleaner'
import { getFieldErrors } from '~/utils/validation'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/profil', en: '/dashboard-cleaner/profile' } })
const { t } = useI18n(), authStore = useAuthStore(), userStore = useUserStore()
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? userStore.profile as CleanerProfile : null)
const form = reactive({} as CleanerProfile), email = ref(''), serviceCities = ref<string[]>([]), errors = ref<Record<string, string>>({}), saved = ref(false)
const saving = ref(false)
const actionError = ref(false)
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([userStore.loadCurrentProfile(id), userStore.loadDirectory()])
  if (!profile.value) return
  Object.assign(form, normalizeCleanerProfile(profile.value))
  serviceCities.value = form.serviceAreas.map((area) => area.cityCode)
  email.value = authStore.user?.email ?? ''
}
watch(() => authStore.user?.id, load, { immediate: true })
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name })))
const toggleCity = (code: string) => serviceCities.value = serviceCities.value.includes(code) ? serviceCities.value.filter((item) => item !== code) : [...serviceCities.value, code]
const toggleLanguage = (language: string) => form.languages = form.languages.includes(language) ? form.languages.filter((item) => item !== language) : [...form.languages, language]
const uploadAvatar = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    if (!authStore.user) throw new Error('authentication_required')
    form.avatarUrl = (await useNuxtApp().$uploads.uploadAvatar(file, authStore.user.id)).storagePath
  }
  catch {
    actionError.value = true
  }
}
const save = async () => {
  if (saving.value) return
  actionError.value = false
  saved.value = false
  const result = createCleanerProfileSchema(t).safeParse(form)
  const validEmail = z.string().email().safeParse(email.value)
  if (!result.success || !validEmail.success) {
    errors.value = result.success ? { email: t('validation.email') } : getFieldErrors(result.error)
    return
  }
  saving.value = true
  try {
    form.serviceAreas = serviceCities.value.map((cityCode) => ({ cityCode, radiusKm: form.serviceRadiusKm }))
    await userStore.updateCleaner({ ...form })
    await authStore.updateAccount({ email: email.value, displayName: `${form.firstName} ${form.lastName}`, avatarSeed: authStore.user?.avatarSeed ?? form.id })
    errors.value = {}
    saved.value = true
  }
  catch {
    actionError.value = true
  }
  finally {
    saving.value = false
  }
}
useSeoMeta({ title: () => t('cleaner.profile.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.cleaner-profile-page { display: grid; gap: $space-6; max-width: 60rem; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } form, fieldset { display: grid; gap: $space-5; } fieldset { grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); padding: $space-4; border: 1px solid $color-border; border-radius: $radius-md; } legend { padding-inline: $space-2; font-weight: $font-weight-bold; } label { display: flex; gap: $space-2; align-items: center; } &__avatar { display: flex; gap: $space-4; align-items: center; } &__grid, &__checks { display: grid; gap: $space-4; } @media (min-width: $breakpoint-md) { &__grid, &__checks { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>
