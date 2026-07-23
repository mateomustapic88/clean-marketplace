<template>
  <ProtectedShell
    :title="t('dashboard.admin.title', { name: authStore.user?.displayName ?? '' })"
    :description="t('dashboard.admin.description')"
    :is-demo="authStore.user?.isDemo ?? false"
  >
    <h2>{{ t('dashboard.phase2Title') }}</h2>
    <p>{{ t('dashboard.phase2Description') }}</p>
    <BaseAlert variant="warning">
      {{ t('dashboard.admin.mockNotice') }}
    </BaseAlert>
  </ProtectedShell>
</template>

<script setup lang="ts">
import ProtectedShell from '~/components/auth/ProtectedShell.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'role'],
  roles: ['admin'],
})

const { t } = useI18n()
const authStore = useAuthStore()

useSeoMeta({
  title: () => t('dashboard.admin.metaTitle'),
  robots: 'noindex, nofollow',
})
</script>
