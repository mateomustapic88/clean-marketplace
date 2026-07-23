<template>
  <div class="owner-settings">
    <header><h1>{{ t('owner.settings.title') }}</h1><p>{{ t('owner.settings.description') }}</p></header>
    <BaseAlert v-if="saved" variant="success">{{ t('owner.settings.saved') }}</BaseAlert>
    <BaseCard v-if="profile">
      <form @submit.prevent="save">
        <fieldset>
          <legend>{{ t('owner.settings.notifications') }}</legend>
          <BaseCheckbox v-model="preferences.email" :label="t('owner.settings.email')" />
          <BaseCheckbox v-model="preferences.inApp" :label="t('owner.settings.inApp')" />
          <BaseCheckbox v-model="preferences.jobUpdates" :label="t('owner.settings.jobUpdates')" />
          <BaseCheckbox v-model="preferences.offers" :label="t('owner.settings.offers')" />
          <BaseCheckbox v-model="preferences.marketing" :label="t('owner.settings.marketing')" />
        </fieldset>
        <BaseSelect v-model="contact" :label="t('owner.profile.contactMethod')" :options="contactOptions" />
        <BaseSelect v-model="language" :label="t('owner.profile.language')" :options="languageOptions" />
        <BaseSelect v-model="timeZone" :label="t('owner.profile.timeZone')" :options="timeZoneOptions" />
        <BaseButton type="submit">{{ t('owner.settings.save') }}</BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import type { OwnerProfile, NotificationPreferences } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/postavke', en: '/dashboard/settings' } })
const { t } = useI18n(), authStore = useAuthStore(), userStore = useUserStore()
const profile = computed(() => userStore.profile as OwnerProfile | null)
const preferences = reactive<NotificationPreferences>({ ...(profile.value?.notificationPreferences ?? { email: true, inApp: true, jobUpdates: true, offers: true, marketing: false }) })
const contact = ref(profile.value?.preferredContactMethod ?? 'email'), language = ref(profile.value?.preferredLanguage ?? 'hr'), timeZone = ref(profile.value?.timeZone ?? 'Europe/Zagreb'), saved = ref(false)
const loadOwnerSettings = async (userId?: string) => {
  if (!userId) return
  await userStore.loadCurrentProfile(userId)
  if (!profile.value) return
  Object.assign(preferences, profile.value.notificationPreferences)
  contact.value = profile.value.preferredContactMethod
  language.value = profile.value.preferredLanguage ?? 'hr'
  timeZone.value = profile.value.timeZone ?? 'Europe/Zagreb'
}
watch(() => authStore.user?.id, loadOwnerSettings, { immediate: true })
const contactOptions = computed(() => ['email', 'phone', 'sms'].map((value) => ({ value, label: t(`owner.profile.contact.${value}`) })))
const languageOptions = computed(() => ['hr', 'en'].map((value) => ({ value, label: t(`languages.${value}`) })))
const timeZoneOptions = ['Europe/Zagreb', 'Europe/London', 'Europe/Berlin'].map((value) => ({ value, label: value }))
const save = async () => {
  if (!profile.value) return
  await userStore.updateOwner({
    ...profile.value,
    notificationPreferences: { ...preferences },
    preferredContactMethod: contact.value as OwnerProfile['preferredContactMethod'],
    preferredLanguage: language.value as 'hr' | 'en',
    timeZone: timeZone.value,
    avatarUrl: profile.value.avatarUrl ?? null,
    onboardingCompleted: profile.value.onboardingCompleted ?? true,
    apartmentName: profile.value.apartmentName ?? null,
    apartmentCityCode: profile.value.apartmentCityCode ?? null,
    apartmentAddress: profile.value.apartmentAddress ?? null,
  })
  saved.value = true
}
useSeoMeta({ title: () => t('owner.settings.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-settings { display: grid; gap: $space-6; max-width: 48rem; > header h1 { font-size: $font-size-3xl; } > header p { margin-top: $space-2; color: $color-text-secondary; } form, fieldset { display: grid; gap: $space-4; } fieldset { padding: 0; border: 0; } legend { margin-bottom: $space-3; font-size: $font-size-xl; font-weight: $font-weight-bold; } }
</style>
