<template>
  <LegalTemplate
    :eyebrow="t('legal.terms.eyebrow')"
    :title="t('legal.terms.title')"
    :description="t('legal.terms.description')"
    :contents-label="t('legal.contents')"
    :review-title="t('legal.reviewTitle')"
    :review-description="t('legal.reviewDescription')"
    :sections="sections"
  />
</template>

<script setup lang="ts">
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/uvjeti-koristenja', en: '/terms', sl: '/pogoji-uporabe' } })
const { t, locale } = useI18n()
const sections = computed(() => Array.from({ length: 6 }, (_, index) => ({
  id: `section-${index + 1}`,
  title: t(`legal.terms.sections.${index + 1}.title`),
  paragraphs: [t(`legal.terms.sections.${index + 1}.text`)],
})))
usePublicSeo({
  title: computed(() => t('legal.terms.metaTitle')),
  description: computed(() => t('legal.terms.metaDescription')),
  path: computed(() => getAppRoute('terms', locale.value)),
})
</script>
