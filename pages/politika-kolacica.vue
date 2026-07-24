<template>
  <LegalTemplate
    :eyebrow="t('legal.cookies.eyebrow')"
    :title="t('legal.cookies.title')"
    :description="t('legal.cookies.description')"
    :contents-label="t('legal.contents')"
    :review-title="t('legal.reviewTitle')"
    :review-description="t('legal.reviewDescription')"
    :sections="sections"
  />
</template>

<script setup lang="ts">
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/politika-kolacica', en: '/cookie-policy', sl: '/politika-piskotkov' } })
const { t, locale } = useI18n()
const sections = computed(() => Array.from({ length: 5 }, (_, index) => ({
  id: `section-${index + 1}`,
  title: t(`legal.cookies.sections.${index + 1}.title`),
  paragraphs: [t(`legal.cookies.sections.${index + 1}.text`)],
})))

usePublicSeo({
  title: computed(() => t('legal.cookies.metaTitle')),
  description: computed(() => t('legal.cookies.metaDescription')),
  path: computed(() => getAppRoute('cookies', locale.value)),
})
</script>
