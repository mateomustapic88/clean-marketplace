<template>
  <div class="owner-profile-page">
    <header><h1>{{ t('owner.profile.title') }}</h1><p>{{ t('owner.profile.description') }}</p></header>
    <ProgressCard :title="t('owner.dashboard.profileTitle')" :description="t('owner.dashboard.profileDescription')" :value="completion" />
    <BaseAlert v-if="saved" variant="success">{{ t('owner.profile.saved') }}</BaseAlert>
    <BaseAlert v-if="actionError" variant="error">{{ t('common.actionError') }}</BaseAlert>
    <BaseCard v-if="profile">
      <form novalidate @submit.prevent="save">
        <div class="owner-profile-page__avatar"><BaseAvatar :name="`${form.firstName} ${form.lastName}`" size="lg" /><div><strong>{{ t('owner.profile.avatar') }}</strong><input type="file" accept=".jpg,.jpeg,.png,.webp" :aria-label="t('owner.profile.avatar')" @change="uploadAvatar"></div></div>
        <div class="owner-profile-page__grid">
          <BaseInput v-model="form.firstName" required :label="t('auth.fields.firstName')" :error="errors.firstName ?? ''" />
          <BaseInput v-model="form.lastName" required :label="t('auth.fields.lastName')" :error="errors.lastName ?? ''" />
          <BaseInput v-model="email" type="email" required :label="t('auth.fields.email')" :error="errors.email ?? ''" />
          <BaseInput v-model="form.phone" type="tel" required :label="t('auth.fields.phone')" :error="errors.phone ?? ''" />
          <BaseSelect v-model="form.cityCode" required :label="t('auth.fields.city')" :options="cityOptions" :error="errors.cityCode ?? ''" />
          <BaseInput v-model="form.companyName" :label="t('owner.profile.company')" />
          <BaseInput v-model="form.agencyName" :label="t('owner.profile.agency')" />
          <BaseSelect v-model="form.preferredContactMethod" :label="t('owner.profile.contactMethod')" :options="contactOptions" />
          <BaseSelect v-model="form.preferredLanguage" :label="t('owner.profile.language')" :options="languageOptions" />
          <BaseSelect v-model="form.timeZone" :label="t('owner.profile.timeZone')" :options="timeZoneOptions" />
        </div>
        <BaseButton type="submit" :loading="saving">{{ t('owner.profile.save') }}</BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { OwnerProfile } from '~/domains/users/types'
import { createOwnerProfileSchema } from '~/schemas/validation'
import { getProfileCompletion } from '~/services/jobs/jobLifecycle'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { getFieldErrors } from '~/utils/validation'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/profil', en: '/dashboard/profile' } })
const { t } = useI18n(), authStore = useAuthStore(), userStore = useUserStore()
const profile = computed(() => userStore.profile as OwnerProfile | null)
const normalized = (value: OwnerProfile) => ({ ...value, preferredLanguage: value.preferredLanguage ?? 'hr' as const, timeZone: value.timeZone ?? 'Europe/Zagreb', avatarUrl: value.avatarUrl ?? null, onboardingCompleted: value.onboardingCompleted ?? true, apartmentName: value.apartmentName ?? null, apartmentCityCode: value.apartmentCityCode ?? null, apartmentAddress: value.apartmentAddress ?? null })
const form = reactive(profile.value ? normalized(profile.value) : {} as OwnerProfile)
const email = ref(authStore.user?.email ?? ''), errors = ref<Record<string, string>>({}), saved = ref(false)
const saving = ref(false)
const actionError = ref(false)
const loadOwnerProfile = async (userId?: string) => {
  if (!userId) return
  await Promise.all([
    userStore.loadCurrentProfile(userId),
    userStore.loadDirectory(),
  ])
  if (profile.value) Object.assign(form, normalized(profile.value))
  email.value = authStore.user?.email ?? ''
}
watch(() => authStore.user?.id, loadOwnerProfile, { immediate: true })
const completion = computed(() => profile.value ? getProfileCompletion(normalized(profile.value)) : 0)
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name })))
const contactOptions = computed(() => ['email', 'phone', 'sms'].map((value) => ({ value, label: t(`owner.profile.contact.${value}`) })))
const languageOptions = computed(() => ['hr', 'en'].map((value) => ({ value, label: t(`languages.${value}`) })))
const timeZoneOptions = ['Europe/Zagreb', 'Europe/London', 'Europe/Berlin'].map((value) => ({ value, label: value }))
const save = async () => {
  if (saving.value) return
  actionError.value = false
  saved.value = false
  const result = createOwnerProfileSchema(t).safeParse(form)
  const emailResult = z.string().email().safeParse(email.value)
  if (!result.success || !emailResult.success) {
    errors.value = result.success
      ? { email: t('validation.email') }
      : getFieldErrors(result.error)
    return
  }
  errors.value = {}
  saving.value = true
  try {
    await userStore.updateOwner({ ...form, companyName: form.companyName || null, agencyName: form.agencyName || null })
    await authStore.updateAccount({ email: email.value, displayName: `${form.firstName} ${form.lastName}`, avatarSeed: authStore.user?.avatarSeed ?? form.id })
    saved.value = true
  }
  catch {
    actionError.value = true
  }
  finally {
    saving.value = false
  }
}
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
useSeoMeta({ title: () => t('owner.profile.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-profile-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { margin-top: $space-2; color: $color-text-secondary; }
  form { display: grid; gap: $space-6; } &__avatar { display: flex; gap: $space-4; align-items: center; } &__avatar div { display: grid; gap: $space-2; }
  &__grid { display: grid; gap: $space-4; } @media (min-width: $breakpoint-md) { &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
}
</style>
