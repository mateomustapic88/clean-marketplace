<template>
  <div v-if="isIncomplete" class="profile-completion-notice">
    <BaseAlert variant="warning" :title="t('profileCompletion.bannerTitle')">
      <div class="profile-completion-notice__banner-content">
        <span>{{ t('profileCompletion.bannerDescription') }}</span>
        <BaseButton size="sm" @click="completeProfile">
          {{ t('profileCompletion.action') }}
        </BaseButton>
      </div>
    </BaseAlert>

    <BaseModal
      v-model="promptOpen"
      :title="t('profileCompletion.title')"
      :description="t('profileCompletion.description')"
      @close="dismissPrompt"
    >
      <p>{{ t('profileCompletion.restrictions') }}</p>
      <template #footer>
        <BaseButton variant="secondary" @click="dismissPrompt">
          {{ t('profileCompletion.later') }}
        </BaseButton>
        <BaseButton @click="completeProfile">
          {{ t('profileCompletion.action') }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

const authStore = useAuthStore()
const userStore = useUserStore()
const { t } = useI18n()
const { onboardingPath } = useProfileCompletionGuard()
const promptOpen = ref(false)
const loadedUserId = ref<string | null>(null)

const storageKey = computed(() =>
  authStore.user ? `clean_marketplace_profile_prompt:${authStore.user.id}` : null)

const isIncomplete = computed(() => {
  const user = authStore.user
  const profile = userStore.profile
  return Boolean(
    user
    && user.role !== 'admin'
    && loadedUserId.value === user.id
    && profile?.userId === user.id
    && 'onboardingCompleted' in profile
    && !profile.onboardingCompleted,
  )
})

const promptWasShown = () => {
  if (!import.meta.client || !storageKey.value) return true
  return sessionStorage.getItem(storageKey.value) === 'shown'
}

const markPromptAsShown = () => {
  if (import.meta.client && storageKey.value) {
    sessionStorage.setItem(storageKey.value, 'shown')
  }
}

const loadProfile = async (userId?: string) => {
  promptOpen.value = false
  loadedUserId.value = null
  if (!userId || authStore.user?.role === 'admin') return
  try {
    if (userStore.profile?.userId !== userId) {
      await userStore.loadCurrentProfile(userId)
    }
    loadedUserId.value = userId
    if (isIncomplete.value && !promptWasShown()) {
      promptOpen.value = true
    }
  }
  catch {
    // Individual pages retain their existing error states if profile loading fails.
  }
}

watch(() => authStore.user?.id, loadProfile, { immediate: true })
watch(isIncomplete, (incomplete) => {
  if (incomplete && !promptWasShown()) promptOpen.value = true
  if (!incomplete) promptOpen.value = false
})

const dismissPrompt = () => {
  markPromptAsShown()
  promptOpen.value = false
}

const completeProfile = async () => {
  markPromptAsShown()
  promptOpen.value = false
  if (onboardingPath.value) await navigateTo(onboardingPath.value)
}
</script>

<style scoped lang="scss">
.profile-completion-notice {
  margin-bottom: $space-6;

  &__banner-content {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    align-items: center;
    justify-content: space-between;
  }

  p {
    color: $color-text-secondary;
  }
}
</style>
