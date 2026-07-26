<template>
  <div class="apartment-cleaning-page">
    <PageHero
      :eyebrow="t('apartmentCleaning.eyebrow')"
      :title="t('apartmentCleaning.title')"
      :description="t('apartmentCleaning.description')"
    />

    <section class="apartment-cleaning-page__section container">
      <Breadcrumbs :items="breadcrumbs" />
      <div class="apartment-cleaning-page__intro">
        <p>{{ t('apartmentCleaning.intro.lead') }}</p>
        <ul>
          <li v-for="item in intentItems" :key="item">
            <CheckCircle2 :size="18" aria-hidden="true" />
            {{ t(`apartmentCleaning.intro.items.${item}`) }}
          </li>
        </ul>
      </div>
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
      <div class="apartment-cleaning-page__split">
        <div>
          <SectionHeader
            align="left"
            :eyebrow="t('apartmentCleaning.pricing.eyebrow')"
            :title="t('apartmentCleaning.pricing.title')"
            :description="t('apartmentCleaning.pricing.description')"
          />
          <BaseButton :to="getAppRoute('jobs', locale)">
            {{ t('apartmentCleaning.pricing.action') }}
          </BaseButton>
        </div>
        <div class="apartment-cleaning-page__price-factors">
          <article v-for="item in priceFactors" :key="item">
            <h3>{{ t(`apartmentCleaning.pricing.items.${item}.title`) }}</h3>
            <p>{{ t(`apartmentCleaning.pricing.items.${item}.description`) }}</p>
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
          :eyebrow="t('apartmentCleaning.finding.eyebrow')"
          :title="t('apartmentCleaning.finding.title')"
          :description="t('apartmentCleaning.finding.description')"
        />
        <div class="apartment-cleaning-page__checklist">
          <article v-for="item in findingItems" :key="item">
            <CheckCircle2 :size="22" aria-hidden="true" />
            <h3>{{ t(`apartmentCleaning.finding.items.${item}.title`) }}</h3>
            <p>{{ t(`apartmentCleaning.finding.items.${item}.description`) }}</p>
          </article>
        </div>
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
      <div class="apartment-cleaning-page__season">
        <SectionHeader
          align="left"
          :eyebrow="t('apartmentCleaning.season.eyebrow')"
          :title="t('apartmentCleaning.season.title')"
          :description="t('apartmentCleaning.season.description')"
        />
        <div>
          <article v-for="item in seasonItems" :key="item">
            <h3>{{ t(`apartmentCleaning.season.items.${item}.title`) }}</h3>
            <p>{{ t(`apartmentCleaning.season.items.${item}.description`) }}</p>
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
const intentItems = ['person', 'price', 'city', 'jobs'] as const
const serviceItems = [
  'turnover',
  'regular',
  'deep',
  'linen',
  'windows',
  'urgent',
] as const
const priceFactors = ['size', 'turnover', 'extras', 'location'] as const
const findingItems = ['availability', 'scope', 'comparison', 'agreement'] as const
const guideItems = ['details', 'offers', 'comparison', 'agreement'] as const
const seasonItems = ['preseason', 'turnover', 'weekend'] as const
const cities = [
  { code: 'split', name: 'Split' },
  { code: 'makarska', name: 'Makarska' },
  { code: 'zadar', name: 'Zadar' },
  { code: 'sibenik', name: 'Šibenik' },
  { code: 'dubrovnik', name: 'Dubrovnik' },
  { code: 'pula', name: 'Pula' },
  { code: 'rijeka', name: 'Rijeka' },
  { code: 'zagreb', name: 'Zagreb' },
] as const
const faqKeys = ['1', '2', '3', '4', '5', '6', '7', '8'] as const
const faqItems = computed(() => faqKeys.map((key) => ({
  question: t(`apartmentCleaning.faq.items.${key}.question`),
  answer: t(`apartmentCleaning.faq.items.${key}.answer`),
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
          '@type': 'WebPage',
          '@id': new URL(
            getAppRoute('apartmentCleaning', locale.value),
            String(config.public.siteUrl),
          ).href,
          'name': t('apartmentCleaning.metaTitle'),
          'description': t('apartmentCleaning.metaDescription'),
          'inLanguage': locale.value,
          'about': [
            t('apartmentCleaning.schema.serviceName'),
            t('apartmentCleaning.schema.priceTopic'),
            t('apartmentCleaning.schema.cleanerTopic'),
          ],
        },
        {
          '@type': 'Service',
          'name': t('apartmentCleaning.schema.serviceName'),
          'description': t('apartmentCleaning.metaDescription'),
          'serviceType': t('apartmentCleaning.schema.serviceType'),
          'areaServed': cities.map((city) => ({
            '@type': 'City',
            'name': city.name,
            'addressCountry': 'HR',
          })),
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
          '@type': 'ItemList',
          'name': t('apartmentCleaning.schema.cityListName'),
          'itemListElement': cities.map((city, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': t('apartmentCleaning.adriatic.cityKeyword', { city: city.name }),
            'url': new URL(
              `${getAppRoute('cleaners', locale.value)}?city=${city.code}`,
              String(config.public.siteUrl),
            ).href,
          })),
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

  &__intro {
    display: grid;
    gap: $space-5;
    padding: $space-5;
    margin-top: $space-6;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    p {
      color: $color-text-secondary;
    }

    ul {
      display: grid;
      gap: $space-3;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    li {
      display: flex;
      gap: $space-2;
      align-items: flex-start;
      font-weight: $font-weight-medium;

      svg {
        flex: 0 0 auto;
        margin-top: 0.2rem;
        color: $color-primary;
      }
    }
  }

  &__audiences,
  &__services,
  &__cities,
  &__checklist {
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

  &__split,
  &__season {
    display: grid;
    gap: $space-8;
    align-items: start;
  }

  &__split .base-button {
    margin-top: $space-5;
  }

  &__price-factors {
    display: grid;
    gap: $space-4;
  }

  &__price-factors article,
  &__season article {
    padding: $space-5;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
    box-shadow: $shadow-sm;

    p {
      margin-top: $space-2;
      color: $color-text-secondary;
    }
  }

  &__services article,
  &__cities article,
  &__checklist article {
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

  &__checklist article {
    box-shadow: $shadow-sm;
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

  &__season > div {
    display: grid;
    gap: $space-4;
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
    &__services,
    &__checklist {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__cities {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__intro,
    &__split,
    &__season {
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    }

    &__intro ul {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__services {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &__cities {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}
</style>
