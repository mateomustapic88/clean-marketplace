<template>
  <div class="pricing-page">
    <PageHero :eyebrow="t('pricing.eyebrow')" :title="t('pricing.title')" :description="t('pricing.description')" />
    <section class="pricing-page__section container">
      <div class="pricing-page__owner">
        <Home :size="30" />
        <div><h2>{{ t('pricing.owner.title') }}</h2><p>{{ t('pricing.owner.description') }}</p></div>
        <strong>{{ t('pricing.owner.price') }}</strong>
      </div>
      <article class="pricing-page__plan">
        <BaseBadge variant="premium">{{ t('pricing.plan.badge') }}</BaseBadge>
        <h2>{{ t('pricing.plan.title') }}</h2>
        <p>{{ t('pricing.plan.trial') }}</p>
        <div><PriceDisplay :value="39" :suffix="t('pricing.plan.month')" /></div>
        <ul><li v-for="item in 7" :key="item"><Check :size="18" />{{ t(`pricing.plan.features.${item}`) }}</li></ul>
        <BaseButton block size="lg" :to="getAppRoute('register', locale)">{{ t('pricing.plan.action') }}</BaseButton>
        <small>{{ t('pricing.plan.noCard') }}</small>
      </article>
      <div class="pricing-page__notes">
        <BaseAlert variant="info" :title="t('pricing.notes.commissionTitle')">{{ t('pricing.notes.commission') }}</BaseAlert>
        <BaseAlert variant="warning" :title="t('pricing.notes.demoTitle')">{{ t('pricing.notes.demo') }}</BaseAlert>
      </div>
    </section>
    <section class="pricing-page__section pricing-page__section--tinted">
      <div class="container">
        <SectionHeader :title="t('pricing.faqTitle')" />
        <FaqAccordion :items="faqItems" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Check, Home } from '@lucide/vue'
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/cijene', en: '/pricing' } })
const { t, locale } = useI18n()
const faqItems = computed(() => Array.from({ length: 4 }, (_, index) => ({
  question: t(`pricing.faq.${index + 1}.question`),
  answer: t(`pricing.faq.${index + 1}.answer`),
})))
usePublicSeo({
  title: computed(() => t('pricing.metaTitle')),
  description: computed(() => t('pricing.metaDescription')),
  path: computed(() => getAppRoute('pricing', locale.value)),
})
</script>

<style scoped lang="scss">
.pricing-page {
  &__section {
    padding-block: $space-20;

    &--tinted {
      background: $color-primary-light;
    }
  }

  &__owner {
    display: grid;
    gap: $space-4;
    align-items: center;
    max-width: 50rem;
    padding: $space-6;
    margin: 0 auto $space-8;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;

    svg {
      color: $color-primary;
    }

    p {
      color: $color-text-secondary;
    }

    strong {
      font-size: $font-size-xl;
      color: $color-success;
    }
  }

  &__plan {
    display: grid;
    justify-items: start;
    max-width: 34rem;
    padding: $space-8;
    margin-inline: auto;
    background: $color-surface;
    border: 2px solid $color-primary;
    border-radius: $radius-xl;
    box-shadow: $shadow-lg;

    h2 {
      margin-top: $space-5;
      font-size: $font-size-2xl;
    }

    > p,
    small {
      color: $color-text-secondary;
    }

    > div {
      margin-block: $space-6;
    }

    ul {
      display: grid;
      gap: $space-3;
      padding: 0;
      margin-bottom: $space-6;
      list-style: none;
    }

    li {
      display: flex;
      gap: $space-2;
      align-items: center;
    }

    li svg {
      color: $color-success;
    }

    small {
      width: 100%;
      margin-top: $space-3;
      text-align: center;
    }
  }

  &__notes {
    display: grid;
    gap: $space-4;
    max-width: 50rem;
    margin: $space-8 auto 0;
  }

  @media (min-width: $breakpoint-md) {
    &__owner {
      grid-template-columns: auto 1fr auto;
    }
  }
}
</style>
