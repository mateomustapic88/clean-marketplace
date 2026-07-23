<template>
  <div class="how-page">
    <PageHero :eyebrow="t('how.eyebrow')" :title="t('how.title')" :description="t('how.description')" />
    <section class="how-page__section container">
      <SectionHeader :eyebrow="t('how.ownerEyebrow')" :title="t('how.ownerTitle')" />
      <div class="how-page__steps">
        <article v-for="step in 5" :key="step">
          <span>{{ step }}</span>
          <component :is="icons[step - 1]" :size="26" aria-hidden="true" />
          <h3>{{ t(`how.steps.owner.${step}`) }}</h3>
          <p>{{ t(`how.details.owner.${step}`) }}</p>
        </article>
      </div>
    </section>
    <section class="how-page__section how-page__section--tinted">
      <div class="container">
        <SectionHeader :eyebrow="t('how.cleanerEyebrow')" :title="t('how.cleanerTitle')" />
        <div class="how-page__steps">
          <article v-for="step in 5" :key="step">
            <span>{{ step }}</span>
            <component :is="icons[step - 1]" :size="26" aria-hidden="true" />
            <h3>{{ t(`how.steps.cleaner.${step}`) }}</h3>
            <p>{{ t(`how.details.cleaner.${step}`) }}</p>
          </article>
        </div>
      </div>
    </section>
    <section class="how-page__section container">
      <CallToActionSection
        :title="t('how.ctaTitle')"
        :description="t('how.ctaDescription')"
        :primary-label="t('header.register')"
        :primary-to="getAppRoute('register', locale)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { BadgeCheck, ClipboardPlus, MessageSquareText, Search, Star } from '@lucide/vue'
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/kako-funkcionira', en: '/how-it-works' } })
const { t, locale } = useI18n()
const icons = [ClipboardPlus, MessageSquareText, Search, BadgeCheck, Star]
usePublicSeo({
  title: computed(() => t('how.metaTitle')),
  description: computed(() => t('how.metaDescription')),
  path: computed(() => getAppRoute('howItWorks', locale.value)),
})
</script>

<style scoped lang="scss">
.how-page {
  &__section {
    padding-block: $space-20;

    &--tinted {
      background: $color-primary-light;
    }
  }

  &__steps {
    display: grid;
    gap: $space-5;
    margin-top: $space-10;
  }

  article {
    position: relative;
    padding: $space-6;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    > span {
      position: absolute;
      top: $space-4;
      right: $space-4;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: rgba($color-primary, 0.18);
    }

    svg {
      color: $color-primary;
    }

    h3 {
      margin-block: $space-4 $space-2;
    }

    p {
      color: $color-text-secondary;
    }
  }

  @media (min-width: $breakpoint-md) {
    &__steps {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__steps {
      grid-template-columns: repeat(5, 1fr);
    }
  }
}
</style>
