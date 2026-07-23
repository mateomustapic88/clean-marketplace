<template>
  <div class="public-home">
    <HeroSection />
    <section class="public-home__section public-home__problem">
      <div class="container">
        <SectionHeader
          :eyebrow="t('publicHome.problem.eyebrow')"
          :title="t('publicHome.problem.title')"
          :description="t('publicHome.problem.description')"
        />
        <div class="public-home__problem-grid">
          <article v-for="item in problems" :key="item.key">
            <component :is="item.icon" :size="24" aria-hidden="true" />
            <h3>{{ t(`publicHome.problem.items.${item.key}.title`) }}</h3>
            <p>{{ t(`publicHome.problem.items.${item.key}.description`) }}</p>
          </article>
        </div>
      </div>
    </section>
    <section class="public-home__section public-home__steps">
      <div class="container">
        <SectionHeader :eyebrow="t('publicHome.steps.eyebrow')" :title="t('publicHome.steps.title')" />
        <div class="public-home__step-grid">
          <article v-for="(step, index) in ownerSteps.slice(0, 3)" :key="step">
            <span>{{ index + 1 }}</span>
            <h3>{{ t(step) }}</h3>
          </article>
        </div>
        <BaseButton variant="secondary" :to="getAppRoute('howItWorks', locale)">
          {{ t('publicHome.steps.action') }}
        </BaseButton>
      </div>
    </section>
    <section class="public-home__section">
      <div class="public-home__split container">
        <div>
          <SectionHeader align="left" :eyebrow="t('publicHome.owners.eyebrow')" :title="t('publicHome.owners.title')" :description="t('publicHome.owners.description')" />
          <ul><li v-for="item in 4" :key="item"><CheckCircle2 />{{ t(`publicHome.owners.items.${item}`) }}</li></ul>
          <BaseButton :to="getAppRoute('register', locale)">{{ t('publicHome.owners.action') }}</BaseButton>
        </div>
        <div class="public-home__benefit-card">
          <ClipboardList :size="36" />
          <h3>{{ t('publicHome.owners.cardTitle') }}</h3>
          <p>{{ t('publicHome.owners.cardDescription') }}</p>
        </div>
      </div>
    </section>
    <section class="public-home__section public-home__section--tinted">
      <div class="public-home__split public-home__split--reverse container">
        <div class="public-home__benefit-card">
          <Sparkles :size="36" />
          <h3>{{ t('publicHome.cleanerBenefits.cardTitle') }}</h3>
          <p>{{ t('publicHome.cleanerBenefits.cardDescription') }}</p>
        </div>
        <div>
          <SectionHeader align="left" :eyebrow="t('publicHome.cleanerBenefits.eyebrow')" :title="t('publicHome.cleanerBenefits.title')" :description="t('publicHome.cleanerBenefits.description')" />
          <ul><li v-for="item in 4" :key="item"><CheckCircle2 />{{ t(`publicHome.cleanerBenefits.items.${item}`) }}</li></ul>
          <BaseButton :to="getAppRoute('jobs', locale)">{{ t('publicHome.cleanerBenefits.action') }}</BaseButton>
        </div>
      </div>
    </section>
    <section class="public-home__section">
      <div class="container">
        <SectionHeader :eyebrow="t('publicHome.featuredJobs.eyebrow')" :title="t('publicHome.featuredJobs.title')" :description="t('publicHome.featuredJobs.description')" />
        <div class="public-home__cards">
          <JobCard v-for="job in featuredJobs" :key="job.id" :job="job" :city-name="cityName(job.cityCode)" />
        </div>
        <div class="public-home__center"><BaseButton variant="secondary" :to="getAppRoute('jobs', locale)">{{ t('publicHome.featuredJobs.action') }}</BaseButton></div>
      </div>
    </section>
    <section class="public-home__section public-home__section--tinted">
      <div class="container">
        <SectionHeader :eyebrow="t('publicHome.featuredCleaners.eyebrow')" :title="t('publicHome.featuredCleaners.title')" :description="t('publicHome.featuredCleaners.description')" />
        <div class="public-home__cards">
          <CleanerCard v-for="cleaner in featuredCleaners" :key="cleaner.id" :cleaner="cleaner" :city-name="cityName(cleaner.cityCode)" />
        </div>
        <div class="public-home__center"><BaseButton variant="secondary" :to="getAppRoute('cleaners', locale)">{{ t('publicHome.featuredCleaners.action') }}</BaseButton></div>
      </div>
    </section>
    <section class="public-home__section public-home__transparency">
      <div class="container">
        <SectionHeader :eyebrow="t('publicHome.transparency.eyebrow')" :title="t('publicHome.transparency.title')" :description="t('publicHome.transparency.description')" />
        <div class="public-home__transparency-grid">
          <article v-for="item in transparencyItems" :key="item.key">
            <component :is="item.icon" :size="28" />
            <h3>{{ t(`publicHome.transparency.items.${item.key}.title`) }}</h3>
            <p>{{ t(`publicHome.transparency.items.${item.key}.description`) }}</p>
          </article>
        </div>
        <BaseAlert variant="info" :title="t('publicHome.transparency.mutualTitle')">
          {{ t('publicHome.transparency.mutualDescription') }}
        </BaseAlert>
      </div>
    </section>
    <section class="public-home__section">
      <div class="container">
        <SectionHeader :eyebrow="t('publicHome.pricing.eyebrow')" :title="t('publicHome.pricing.title')" :description="t('publicHome.pricing.description')" />
        <div class="public-home__price-grid">
          <BaseCard v-for="plan in pricingPlans" :key="plan.role" class="public-home__price-card">
            <div>
              <h3>{{ t(`pricing.${plan.translationKey}.title`) }}</h3>
              <p>{{ t(`pricing.${plan.translationKey}.trial`) }}</p>
            </div>
            <PriceDisplay :value="plan.monthlyAmount / 100" :suffix="t('pricing.plan.month')" />
            <BaseButton :to="getAppRoute('pricing', locale)">{{ t('publicHome.pricing.action') }}</BaseButton>
          </BaseCard>
        </div>
      </div>
    </section>
    <section id="faq" class="public-home__section public-home__section--tinted">
      <div class="container">
        <SectionHeader :eyebrow="t('publicHome.faq.eyebrow')" :title="t('publicHome.faq.title')" />
        <FaqAccordion :items="faqItems" />
      </div>
    </section>
    <section class="public-home__section">
      <div class="container">
        <CallToActionSection
          :title="t('publicHome.cta.title')"
          :description="t('publicHome.cta.description')"
          :primary-label="t('publicHome.cta.primary')"
          :primary-to="getAppRoute('register', locale)"
          :secondary-label="t('publicHome.cta.secondary')"
          :secondary-to="getAppRoute('jobs', locale)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircle2,
  ClipboardList,
  MessagesSquare,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Tags,
} from '@lucide/vue'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { getAppRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/', en: '/' } })
const { t, locale } = useI18n()
const jobsStore = useJobsStore()
const userStore = useUserStore()
const config = useRuntimeConfig()
await Promise.all([jobsStore.loadJobs(), userStore.loadDirectory()])
const featuredJobs = computed(() => jobsStore.jobs
  .filter((job) => ['published', 'receiving_offers'].includes(job.status)).slice(0, 3))
const featuredCleaners = computed(() => [...userStore.cleaners]
  .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)).slice(0, 3))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const problems = [
  { key: 'pricing', icon: Tags },
  { key: 'comparison', icon: Scale },
  { key: 'communication', icon: MessagesSquare },
  { key: 'reliability', icon: SearchCheck },
]
const transparencyItems = [
  { key: 'offers', icon: Scale },
  { key: 'agreement', icon: ShieldCheck },
  { key: 'ratings', icon: Sparkles },
]
const pricingPlans = [
  {
    role: 'owner',
    translationKey: 'owner',
    monthlyAmount: config.public.plans.owner.monthlyAmount,
  },
  {
    role: 'cleaner',
    translationKey: 'plan',
    monthlyAmount: config.public.plans.cleaner.monthlyAmount,
  },
] as const
const ownerSteps = Array.from({ length: 5 }, (_, index) => `how.steps.owner.${index + 1}`)
const faqItems = computed(() => Array.from({ length: 5 }, (_, index) => ({
  question: t(`publicHome.faq.items.${index + 1}.question`),
  answer: t(`publicHome.faq.items.${index + 1}.answer`),
})))
usePublicSeo({
  title: computed(() => t('publicHome.metaTitle')),
  description: computed(() => t('publicHome.metaDescription')),
  path: computed(() => getAppRoute('home', locale.value)),
})
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          'name': 'Clean',
          'url': 'https://clean.hr',
          'inLanguage': locale.value === 'en' ? 'en-GB' : 'hr-HR',
        },
        {
          '@type': 'FAQPage',
          'mainEntity': faqItems.value.map((item) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
          })),
        },
      ],
    })),
  }],
})
</script>

<style scoped lang="scss">
.public-home {
  &__section {
    padding-block: $space-20;

    &--tinted {
      background: $color-primary-light;
    }
  }

  &__problem-grid,
  &__step-grid,
  &__cards,
  &__transparency-grid {
    display: grid;
    gap: $space-5;
    margin-top: $space-10;
  }

  &__problem-grid article,
  &__step-grid article,
  &__transparency-grid article {
    padding: $space-6;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    svg {
      color: $color-primary;
    }

    h3 {
      margin-block: $space-4 $space-2;
      font-size: $font-size-lg;
    }

    p {
      color: $color-text-secondary;
    }
  }

  &__steps {
    text-align: center;

    .base-button {
      margin-top: $space-8;
    }
  }

  &__step-grid article span {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    margin-inline: auto;
    font-weight: $font-weight-bold;
    color: $color-surface;
    place-items: center;
    background: $color-primary;
    border-radius: $radius-full;
  }

  &__split {
    display: grid;
    gap: $space-10;
    align-items: center;

    ul {
      display: grid;
      gap: $space-3;
      padding: 0;
      margin-block: $space-6;
      list-style: none;
    }

    li {
      display: flex;
      gap: $space-3;
      align-items: center;
    }

    li svg {
      flex: 0 0 auto;
      color: $color-success;
    }
  }

  &__benefit-card {
    padding: $space-10;
    background: linear-gradient(145deg, $color-surface, $color-accent-light);
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-lg;

    svg {
      color: $color-primary;
    }

    h3 {
      margin-block: $space-5 $space-3;
      font-size: $font-size-2xl;
    }

    p {
      color: $color-text-secondary;
    }
  }

  &__center {
    margin-top: $space-8;
    text-align: center;
  }

  &__transparency {
    color: $color-surface;
    background: $color-primary-dark;

    :deep(.section-header__eyebrow) {
      color: $color-accent;
    }

    :deep(.section-header__description) {
      color: rgba($color-surface, 0.75);
    }

    .base-alert {
      max-width: 50rem;
      margin: $space-8 auto 0;
    }
  }

  &__price-grid {
    display: grid;
    gap: $space-6;
    max-width: 64rem;
    margin: $space-10 auto 0;
  }

  &__price-card {
    display: grid;
    gap: $space-5;
    align-content: start;

    h3 {
      font-size: $font-size-xl;
    }

    p {
      color: $color-text-secondary;
    }
  }

  @media (min-width: $breakpoint-md) {
    &__problem-grid,
    &__transparency-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    &__step-grid,
    &__cards {
      grid-template-columns: repeat(3, 1fr);
    }

    &__price-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__problem-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    &__split {
      grid-template-columns: repeat(2, 1fr);
    }

    &__split--reverse > :first-child {
      order: 0;
    }

    &__transparency-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
</style>
