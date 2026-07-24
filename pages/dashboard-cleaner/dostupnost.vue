<template>
  <div class="availability-page"><header><h1>{{ t('cleaner.availability.title') }}</h1><p>{{ t('cleaner.availability.description') }}</p></header><BaseAlert v-if="saved" variant="success">{{ t('cleaner.availability.saved') }}</BaseAlert><BaseAlert v-if="actionError" variant="error">{{ t('common.actionError') }}</BaseAlert><BaseCard v-if="profile"><CleanerAvailability v-model="availability" v-model:vacation="vacationMode" /><BaseButton :loading="saving" @click="save">{{ t('cleaner.availability.save') }}</BaseButton></BaseCard></div>
</template>

<script setup lang="ts">
import type { CleanerProfile } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { defaultAvailability, normalizeCleanerProfile } from '~/utils/cleaner'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/dostupnost', en: '/dashboard-cleaner/availability' } })
const { t } = useI18n(), authStore = useAuthStore(), userStore = useUserStore()
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? userStore.profile as CleanerProfile : null)
const availability = ref(defaultAvailability()), vacationMode = ref(false), saved = ref(false)
const saving = ref(false), actionError = ref(false)
const load = async (id?: string) => {
  if (!id) return
  await userStore.loadCurrentProfile(id)
  if (!profile.value) return
  const normalized = normalizeCleanerProfile(profile.value)
  availability.value = normalized.availability
  vacationMode.value = normalized.vacationMode ?? false
}
watch(() => authStore.user?.id, load, { immediate: true })
const save = async () => {
  if (!profile.value || saving.value) return
  saving.value = true
  actionError.value = false
  saved.value = false
  const copiedAvailability = availability.value.map((day) => ({
    ...day,
    ranges: day.ranges.map((range) => ({ ...range })),
  }))
  try {
    await userStore.updateCleaner({ ...normalizeCleanerProfile(profile.value), availability: copiedAvailability, vacationMode: vacationMode.value })
    saved.value = true
  }
  catch {
    actionError.value = true
  }
  finally {
    saving.value = false
  }
}
useSeoMeta({ title: () => t('cleaner.availability.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.availability-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } :deep(.base-card) { display: grid; gap: $space-6; } }
</style>
