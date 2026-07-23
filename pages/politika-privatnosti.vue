<template>
  <LegalTemplate
    :eyebrow="t('legal.privacy.eyebrow')"
    :title="t('legal.privacy.title')"
    :description="t('legal.privacy.description')"
    :contents-label="t('legal.contents')"
    :review-title="t('legal.reviewTitle')"
    :review-description="t('legal.reviewDescription')"
    :sections="sections"
  />
</template>

<script setup lang="ts">
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/politika-privatnosti', en: '/privacy' } })
const { t, locale } = useI18n()
const sections = computed(() => Array.from({ length: 6 }, (_, index) => ({
  id: `section-${index + 1}`,
  title: t(`legal.privacy.sections.${index + 1}.title`),
  paragraphs: [t(`legal.privacy.sections.${index + 1}.text`)],
})))
usePublicSeo({
  title: computed(() => t('legal.privacy.metaTitle')),
  description: computed(() => t('legal.privacy.metaDescription')),
  path: computed(() => getAppRoute('privacy', locale.value)),
})
</script>
