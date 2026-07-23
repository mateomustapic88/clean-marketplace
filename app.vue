<template>
  <NuxtLayout>
    <NuxtPage />
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
