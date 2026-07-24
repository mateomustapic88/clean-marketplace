<template>
  <div class="pricing-page">
    <PageHero :eyebrow="t('pricing.eyebrow')" :title="t('pricing.title')" :description="t('pricing.description')" />
    <section class="pricing-page__section container">
      <div class="pricing-page__period">
        <BillingPeriodToggle v-model="billingPeriod" :discount-percent="annualDiscountPercent" />
      </div>
      <div class="pricing-page__plans">
        <article v-for="plan in pricingPlans" :key="plan.role" class="pricing-page__plan">
          <BaseBadge variant="premium">{{ t(`pricing.${plan.translationKey}.badge`) }}</BaseBadge>
          <h2>{{ t(`pricing.${plan.translationKey}.title`) }}</h2>
          <p>{{ t(`pricing.${plan.translationKey}.trial`) }}</p>
          <div>
            <PriceDisplay :value="plan.amount / 100" :suffix="t(`billing.periodSuffix.${billingPeriod}`)" />
            <p v-if="billingPeriod === 'annual'" class="pricing-page__annual-note">
              {{ t('pricing.annualNote', {
                monthly: formatPrice(plan.monthlyEquivalent / 100, locale),
                savings: formatPrice(plan.annualSavings.amount / 100, locale),
                percent: plan.annualSavings.percent,
              }) }}
            </p>
          </div>
          <ul>
            <li v-for="item in plan.featureCount" :key="item">
              <Check :size="18" />
              {{ t(`pricing.${plan.translationKey}.features.${item}`) }}
            </li>
          </ul>
          <BaseButton block size="lg" :to="getRegistrationRoute(plan.role, locale)">{{ t(`pricing.${plan.translationKey}.action`) }}</BaseButton>
          <small>{{ t(`pricing.${plan.translationKey}.billingNote`) }}</small>
        </article>
      </div>
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
import { Check } from '@lucide/vue'
import type { BillingPeriod } from '~/domains/subscriptions/types'
import { calculateAnnualSavings } from '~/services/billing/billingPresentation'
import { getAppRoute, getRegistrationRoute } from '~/utils/routes'
import { formatPrice } from '~/utils/formatters'

defineI18nRoute({ paths: { hr: '/cijene', en: '/pricing', sl: '/cene' } })
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const billingPeriod = ref<BillingPeriod>('monthly')
const pricingPlans = computed(() => [
  {
    role: 'owner',
    translationKey: 'owner',
    amount: billingPeriod.value === 'annual' ? config.public.plans.owner.annualAmount : config.public.plans.owner.monthlyAmount,
    monthlyEquivalent: config.public.plans.owner.annualAmount / 12,
    annualSavings: calculateAnnualSavings(config.public.plans.owner),
    featureCount: 5,
  },
  {
    role: 'cleaner',
    translationKey: 'plan',
    amount: billingPeriod.value === 'annual' ? config.public.plans.cleaner.annualAmount : config.public.plans.cleaner.monthlyAmount,
    monthlyEquivalent: config.public.plans.cleaner.annualAmount / 12,
    annualSavings: calculateAnnualSavings(config.public.plans.cleaner),
    featureCount: 7,
  },
] as const)
const annualDiscountPercent = computed(() => Math.min(
  ...pricingPlans.value.map((plan) => plan.annualSavings.percent),
))
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

  &__plans {
    display: grid;
    gap: $space-6;
    max-width: 72rem;
    margin-inline: auto;
  }

  &__period {
    display: flex;
    justify-content: center;
    margin-bottom: $space-8;
  }

  &__annual-note {
    margin-top: $space-2;
    color: $color-success;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__plan {
    display: grid;
    justify-items: start;
    padding: $space-8;
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
    &__plans {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
