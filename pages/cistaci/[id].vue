<template>
  <div v-if="cleaner" class="profile-page">
    <div class="container">
      <Breadcrumbs :items="breadcrumbs" />
      <header class="profile-page__header">
        <BaseAvatar :name="fullName" size="lg" />
        <div>
          <div class="profile-page__identity">
            <h1>{{ fullName }}</h1>
            <DemoBadge v-if="cleaner.isDemo" type="profile" />
          </div>
          <p><MapPin :size="18" />{{ cityName(cleaner.cityCode) }}</p>
          <RatingSummary :value="cleaner.averageRating" :count="cleaner.ratingCount" />
        </div>
        <div class="profile-page__price">
          <PriceDisplay :value="cleaner.hourlyRate" :suffix="t('cleaners.card.perHour')" />
          <span>{{ t('cleaners.card.minimum', { price: formatPrice(cleaner.minimumJobPrice, locale) }) }}</span>
        </div>
      </header>
      <div class="profile-page__layout">
        <main>
          <BaseCard class="profile-page__section">
            <h2>{{ t('cleanerProfile.about') }}</h2>
            <p>{{ cleaner.biography }}</p>
          </BaseCard>
          <BaseCard class="profile-page__section">
            <h2>{{ t('cleanerProfile.serviceDetails') }}</h2>
            <dl>
              <div><dt>{{ t('cleanerProfile.experience') }}</dt><dd>{{ t('cleanerProfile.years', { count: cleaner.yearsOfExperience }) }}</dd></div>
              <div><dt>{{ t('cleanerProfile.radius') }}</dt><dd>{{ cleaner.serviceRadiusKm }} km</dd></div>
              <div><dt>{{ t('cleanerProfile.completed') }}</dt><dd>{{ cleaner.completedJobs }}</dd></div>
              <div><dt>{{ t('cleanerProfile.languages') }}</dt><dd>{{ cleaner.languages.map(code => t(`languages.${code}`)).join(', ') }}</dd></div>
            </dl>
            <div class="profile-page__badges">
              <AvailabilityBadge :active="cleaner.weekendAvailable" :label="t('cleanerProfile.weekend')" />
              <AvailabilityBadge :active="cleaner.sameDayAvailable" :label="t('cleanerProfile.sameDay')" />
              <AvailabilityBadge :active="cleaner.bringsSupplies" :label="t('cleanerProfile.supplies')" />
              <AvailabilityBadge :active="cleaner.ownTransportation" :label="t('cleanerProfile.transport')" />
            </div>
          </BaseCard>
          <BaseCard class="profile-page__section">
            <h2>{{ t('cleanerProfile.areas') }}</h2>
            <ul>
              <li v-for="area in cleaner.serviceAreas" :key="area.cityCode">
                <MapPin :size="17" />{{ cityName(area.cityCode) }} - {{ area.radiusKm }} km
              </li>
            </ul>
          </BaseCard>
          <BaseCard class="profile-page__section">
            <h2>{{ t('cleanerProfile.reviews') }}</h2>
            <p v-if="!receivedRatings.length">{{ t('catalog.noRatings') }}</p>
            <ReviewSummary v-if="ratingsStore.summary" :summary="ratingsStore.summary" />
            <article v-for="rating in receivedRatings.slice(0, 4)" :key="rating.id" class="profile-page__review">
              <DemoBadge v-if="rating.isDemo" type="rating" />
              <ReviewCard :review="rating" />
            </article>
          </BaseCard>
        </main>
        <aside>
          <BaseCard class="profile-page__contact">
            <h2>{{ t('cleanerProfile.contactTitle') }}</h2>
            <p>{{ t('cleanerProfile.contactDescription') }}</p>
            <BaseButton block size="lg" :to="getAppRoute('login', locale)">
              {{ t('cleanerProfile.contactAction') }}
            </BaseButton>
            <small>{{ t('cleanerProfile.privateNote') }}</small>
          </BaseCard>
        </aside>
      </div>
    </div>
  </div>
  <div v-else class="profile-page__missing container">
    <BaseEmptyState :title="t('cleanerProfile.notFound')" :description="t('cleanerProfile.notFoundDescription')">
      <template #action><BaseButton :to="getAppRoute('cleaners', locale)">{{ t('cleanerProfile.back') }}</BaseButton></template>
    </BaseEmptyState>
  </div>
</template>

<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import { useRatingsStore } from '~/stores/ratings'
import { useUserStore } from '~/stores/user'
import { formatPrice } from '~/utils/formatters'
import { demoDisplayName } from '~/utils/demoPresentation'
import { getAppRoute, getCleanerRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/cistaci/[id]', en: '/cleaners/[id]', sl: '/cistilci/[id]' } })
const route = useRoute()
const { t, locale } = useI18n()
const userStore = useUserStore()
const ratingsStore = useRatingsStore()
const config = useRuntimeConfig()
await userStore.loadDirectory()
const cleaner = computed(() => userStore.cleaners.find((item) => item.id === String(route.params.id)) ?? null)
if (!cleaner.value) setResponseStatus(404)
if (cleaner.value) await ratingsStore.loadForUser(cleaner.value.userId)
const fullName = computed(() => cleaner.value
  ? demoDisplayName(cleaner.value.firstName, cleaner.value.lastName, cleaner.value.isDemo)
  : '')
const receivedRatings = computed(() => ratingsStore.ratings.filter(
  (rating) => rating.subjectId === cleaner.value?.userId,
))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const breadcrumbs = computed(() => [
  { label: t('navigation.home'), to: getAppRoute('home', locale.value) },
  { label: t('cleaners.title'), to: getAppRoute('cleaners', locale.value) },
  { label: fullName.value || t('cleanerProfile.notFound') },
])
usePublicSeo({
  title: computed(() => cleaner.value ? fullName.value : t('cleanerProfile.notFound')),
  description: computed(() => cleaner.value
    ? t('cleanerProfile.metaDescription', { name: fullName.value, city: cityName(cleaner.value.cityCode) })
    : t('cleanerProfile.notFoundDescription')),
  path: computed(() => getCleanerRoute(String(route.params.id), locale.value)),
  index: computed(() => Boolean(cleaner.value && !cleaner.value.isDemo)),
})
useHead(() => ({
  script: cleaner.value && !cleaner.value.isDemo
    ? [{
        type: 'application/ld+json',
        textContent: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ProfilePage',
              'dateCreated': cleaner.value.createdAt,
              'dateModified': cleaner.value.updatedAt,
              'mainEntity': {
                '@type': 'Person',
                'name': fullName.value,
                'description': cleaner.value.biography,
                'jobTitle': t('navigation.cleaners'),
                'knowsLanguage': cleaner.value.languages,
                'homeLocation': {
                  '@type': 'Place',
                  'name': cityName(cleaner.value.cityCode),
                  'address': {
                    '@type': 'PostalAddress',
                    'addressLocality': cityName(cleaner.value.cityCode),
                    'addressCountry': 'HR',
                  },
                },
                'url': new URL(
                  getCleanerRoute(cleaner.value.id, locale.value),
                  String(config.public.siteUrl),
                ).href,
              },
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': breadcrumbs.value.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.label,
                ...(item.to && {
                  item: new URL(item.to, String(config.public.siteUrl)).href,
                }),
              })),
            },
          ],
        }),
      }]
    : [],
}))
</script>

<style scoped lang="scss">
.profile-page {
  padding-block: $space-8 $space-20;
  background: $color-background;

  &__header {
    display: grid;
    gap: $space-5;
    align-items: center;
    margin-bottom: $space-8;
    padding: $space-8;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    h1 {
      font-size: $font-size-3xl;
    }

    p {
      display: flex;
      gap: $space-2;
      align-items: center;
      color: $color-text-secondary;
    }
  }

  &__identity {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    align-items: center;
    margin-block: $space-3 $space-2;
  }

  &__price {
    display: grid;
    gap: $space-1;

    span {
      font-size: $font-size-xs;
      color: $color-text-secondary;
    }
  }

  &__layout {
    display: grid;
    gap: $space-8;
  }

  &__section {
    margin-bottom: $space-5;

    h2 {
      margin-bottom: $space-5;
      font-size: $font-size-xl;
    }

    dl {
      display: grid;
      gap: $space-3;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      padding-bottom: $space-3;
      border-bottom: 1px solid $color-border;
    }

    dt {
      color: $color-text-secondary;
    }

    ul {
      display: grid;
      gap: $space-3;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      gap: $space-2;
      align-items: center;
    }
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    margin-top: $space-5;
  }

  &__review {
    display: grid;
    gap: $space-3;
    padding-block: $space-5;
    border-top: 1px solid $color-border;
  }

  &__contact {
    display: grid;
    gap: $space-4;

    p,
    small {
      color: $color-text-secondary;
    }
  }

  &__missing {
    padding-block: $space-20;
  }

  @media (min-width: $breakpoint-md) {
    &__header {
      grid-template-columns: auto 1fr auto;
    }

  }

  @media (min-width: $breakpoint-lg) {
    &__layout {
      grid-template-columns: minmax(0, 1fr) 20rem;
    }

    aside {
      position: sticky;
      top: calc($header-height + $space-5);
      align-self: start;
    }
  }
}
</style>
