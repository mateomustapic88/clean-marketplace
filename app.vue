<template>
  <NuxtLoadingIndicator
    color="#24767d"
    :height="3"
    :throttle="120"
  />
  <NuxtLayout>
    <NuxtErrorBoundary>
      <NuxtPage />
      <template #error="{ clearError }">
        <PageErrorState @retry="clearError" />
      </template>
    </NuxtErrorBoundary>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
  titleTemplate: (titleChunk) => titleChunk
    ? `${titleChunk} | ${t('meta.siteName')}`
    : t('meta.siteName'),
}))
</script>
