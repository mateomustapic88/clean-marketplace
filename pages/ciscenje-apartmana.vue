<template>
  <div class="apartment-cleaning-page">
    <PageHero
      :eyebrow="t('apartmentCleaning.eyebrow')"
      :title="t('apartmentCleaning.title')"
      :description="t('apartmentCleaning.description')"
    />

    <section class="apartment-cleaning-page__section container">
      <Breadcrumbs :items="breadcrumbs" />
      <div class="apartment-cleaning-page__audiences">
        <BaseCard v-for="audience in audiences" :key="audience">
          <component
            :is="audience === 'owners' ? Building2 : Sparkles"
            :size="30"
            aria-hidden="true"
          />
          <h2>{{ t(`apartmentCleaning.audiences.${audience}.title`) }}</h2>
          <p>{{ t(`apartmentCleaning.audiences.${audience}.description`) }}</p>
          <BaseButton
            variant="secondary"
            :to="audience === 'owners'
              ? getAppRoute('cleaners', locale)
              : getAppRoute('jobs', locale)"
          >
            {{ t(`apartmentCleaning.audiences.${audience}.action`) }}
          </BaseButton>
        </BaseCard>
      </div>
    </section>

    <section class="apartment-cleaning-page__section apartment-cleaning-page__section--tinted">
      <div class="container">
        <SectionHeader
          :eyebrow="t('apartmentCleaning.services.eyebrow')"
          :title="t('apartmentCleaning.services.title')"
          :description="t('apartmentCleaning.services.description')"
        />
        <div class="apartment-cleaning-page__services">
          <article v-for="item in serviceItems" :key="item">
            <CheckCircle2 :size="24" aria-hidden="true" />
            <h3>{{ t(`apartmentCleaning.services.items.${item}.title`) }}</h3>
            <p>{{ t(`apartmentCleaning.services.items.${item}.description`) }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="apartment-cleaning-page__section container">
      <SectionHeader
        :eyebrow="t('apartmentCleaning.adriatic.eyebrow')"
        :title="t('apartmentCleaning.adriatic.title')"
        :description="t('apartmentCleaning.adriatic.description')"
      />
      <div class="apartment-cleaning-page__cities">
        <article v-for="city in cities" :key="city.code">
          <MapPin :size="22" aria-hidden="true" />
          <h3>{{ city.name }}</h3>
          <p>{{ t('apartmentCleaning.adriatic.cityDescription', { city: city.name }) }}</p>
          <div>
            <NuxtLink :to="`${getAppRoute('cleaners', locale)}?city=${city.code}`">
              {{ t('apartmentCleaning.adriatic.cleanersAction', { city: city.name }) }}
            </NuxtLink>
            <NuxtLink :to="`${getAppRoute('jobs', locale)}?city=${city.code}`">
              {{ t('apartmentCleaning.adriatic.jobsAction', { city: city.name }) }}
            </NuxtLink>
          </div>
        </article>
      </div>
    </section>

    <section class="apartment-cleaning-page__section apartment-cleaning-page__section--tinted">
      <div class="container">
        <SectionHeader
          :eyebrow="t('apartmentCleaning.guide.eyebrow')"
          :title="t('apartmentCleaning.guide.title')"
        />
        <div class="apartment-cleaning-page__guide">
          <article v-for="(step, index) in guideItems" :key="step">
            <span>{{ index + 1 }}</span>
            <div>
              <h3>{{ t(`apartmentCleaning.guide.items.${step}.title`) }}</h3>
              <p>{{ t(`apartmentCleaning.guide.items.${step}.description`) }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="apartment-cleaning-page__section container">
      <SectionHeader
        :eyebrow="t('apartmentCleaning.faq.eyebrow')"
        :title="t('apartmentCleaning.faq.title')"
      />
      <FaqAccordion :items="faqItems" />
    </section>

    <section class="apartment-cleaning-page__section container">
      <CallToActionSection
        :title="t('apartmentCleaning.cta.title')"
        :description="t('apartmentCleaning.cta.description')"
        :primary-label="t('apartmentCleaning.cta.ownerAction')"
        :primary-to="getRegistrationRoute('owner', locale)"
        :secondary-label="t('apartmentCleaning.cta.cleanerAction')"
        :secondary-to="getAppRoute('jobs', locale)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Building2,
  CheckCircle2,
  MapPin,
  Sparkles,
} from '@lucide/vue'
import { getAppRoute, getRegistrationRoute } from '~/utils/routes'

defineI18nRoute({
  paths: {
    hr: '/ciscenje-apartmana',
    en: '/apartment-cleaning-croatia',
    sl: '/ciscenje-apartmajev-hrvaska',
  },
})

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const audiences = ['owners', 'cleaners'] as const
const serviceItems = [
  'turnover',
  'regular',
  'deep',
  'linen',
  'windows',
  'urgent',
] as const
const guideItems = ['details', 'offers', 'comparison', 'agreement'] as const
const cities = [
  { code: 'split', name: 'Split' },
  { code: 'zadar', name: 'Zadar' },
  { code: 'sibenik', name: 'Šibenik' },
  { code: 'dubrovnik', name: 'Dubrovnik' },
  { code: 'pula', name: 'Pula' },
  { code: 'rijeka', name: 'Rijeka' },
  { code: 'zagreb', name: 'Zagreb' },
] as const
const faqItems = computed(() => Array.from({ length: 5 }, (_, index) => ({
  question: t(`apartmentCleaning.faq.items.${index + 1}.question`),
  answer: t(`apartmentCleaning.faq.items.${index + 1}.answer`),
})))
const breadcrumbs = computed(() => [
  { label: t('navigation.home'), to: getAppRoute('home', locale.value) },
  { label: t('navigation.apartmentCleaning') },
])

usePublicSeo({
  title: computed(() => t('apartmentCleaning.metaTitle')),
  description: computed(() => t('apartmentCleaning.metaDescription')),
  path: computed(() => getAppRoute('apartmentCleaning', locale.value)),
})

useHead({
  script: [{
    type: 'application/ld+json',
    textContent: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          'name': t('apartmentCleaning.schema.serviceName'),
          'description': t('apartmentCleaning.metaDescription'),
          'serviceType': t('apartmentCleaning.schema.serviceType'),
          'areaServed': {
            '@type': 'Country',
            'name': 'Croatia',
          },
          'provider': {
            '@type': 'Organization',
            'name': 'Clean',
            'url': String(config.public.siteUrl),
          },
          'url': new URL(
            getAppRoute('apartmentCleaning', locale.value),
            String(config.public.siteUrl),
          ).href,
        },
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': t('navigation.home'),
              'item': new URL(
                getAppRoute('home', locale.value),
                String(config.public.siteUrl),
              ).href,
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': t('navigation.apartmentCleaning'),
            },
          ],
        },
        {
          '@type': 'FAQPage',
          'mainEntity': faqItems.value.map((item) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.answer,
            },
          })),
        },
      ],
    })),
  }],
})
</script>

<style scoped lang="scss">
.apartment-cleaning-page {
  &__section {
    padding-block: $space-16;

    &--tinted {
      background: $color-primary-light;
    }
  }

  &__audiences,
  &__services,
  &__cities {
    display: grid;
    gap: $space-5;
    margin-top: $space-8;
  }

  &__audiences {
    .base-card {
      display: grid;
      justify-items: start;
      gap: $space-4;
    }

    svg {
      color: $color-primary;
    }

    p {
      color: $color-text-secondary;
    }
  }

  &__services article,
  &__cities article {
    padding: $space-5;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    > svg {
      color: $color-primary;
    }

    h3 {
      margin-block: $space-3 $space-2;
    }

    p {
      color: $color-text-secondary;
    }
  }

  &__cities article > div {
    display: grid;
    gap: $space-2;
    margin-top: $space-4;

    a {
      width: fit-content;
      font-weight: $font-weight-semibold;
      color: $color-primary;
    }
  }

  &__guide {
    display: grid;
    gap: $space-4;
    max-width: 56rem;
    margin: $space-8 auto 0;

    article {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: $space-4;
      padding: $space-5;
      background: $color-surface;
      border: 1px solid $color-border;
      border-radius: $radius-lg;
    }

    span {
      display: grid;
      width: 2.5rem;
      height: 2.5rem;
      font-weight: $font-weight-bold;
      color: $color-surface;
      place-items: center;
      background: $color-primary;
      border-radius: $radius-full;
    }

    p {
      margin-top: $space-2;
      color: $color-text-secondary;
    }
  }

  @media (min-width: $breakpoint-md) {
    &__audiences,
    &__services {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__cities {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__services {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &__cities {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}
</style>
