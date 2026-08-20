<template>
  <div class="catalog-page">
    <header class="catalog-page__hero">
      <div class="container">
        <Breadcrumbs :items="[{ label: t('navigation.home'), to: getAppRoute('home', locale) }, { label: t('cleaners.title') }]" />
        <p>{{ t('cleaners.eyebrow') }}</p>
        <h1>{{ t('cleaners.title') }}</h1>
        <span>{{ t('cleaners.description') }}</span>
      </div>
    </header>
    <div class="catalog-page__body container">
      <aside class="catalog-page__sidebar">
        <CleanerFilters v-model="filters" :city-options="cityOptions" @reset="resetFilters" />
      </aside>
      <main class="catalog-page__results">
        <div class="catalog-page__toolbar">
          <p>{{ t('catalog.resultCount', { count: filteredCleaners.length }) }}</p>
          <BaseSelect v-model="sort" :label="t('catalog.sort')" :options="sortOptions" />
          <BaseButton class="catalog-page__filter-button" variant="secondary" @click="drawerOpen = true">
            <SlidersHorizontal :size="18" />{{ t('catalog.filters') }}
          </BaseButton>
        </div>
        <ActiveFilterChips :items="activeChips" @remove="removeFilter" @clear="resetFilters" />
        <p v-if="hasIllustrativeProfiles" class="catalog-page__disclosure" role="note">
          {{ t('cleaners.illustrativeNotice') }}
        </p>
        <div v-if="userStore.isLoading" class="catalog-page__grid">
          <CleanerCardSkeleton v-for="item in pageSize" :key="item" />
        </div>
        <EmptyResults v-else-if="!pagedCleaners.length" @reset="resetFilters" />
        <div v-else class="catalog-page__grid">
          <CleanerCard
            v-for="cleaner in pagedCleaners"
            :key="cleaner.id"
            :cleaner="cleaner"
            :city-name="cityName(cleaner.cityCode)"
          />
        </div>
        <PaginationControls v-model="page" :total-pages="totalPages" :label="t('cleaners.pagination')" />
      </main>
    </div>
    <FilterDrawer v-model="drawerOpen" :title="t('cleaners.filters.title')">
      <CleanerFilters v-model="filters" :city-options="cityOptions" @reset="resetFilters" />
    </FilterDrawer>
  </div>
</template>

<script setup lang="ts">
import { SlidersHorizontal } from '@lucide/vue'
import { useUserStore } from '~/stores/user'
import {
  emptyCleanerFilters,
  serializeQuery,
  type CleanerSort,
} from '~/utils/publicCatalog'
import { getAppRoute, getCleanerRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/cistaci', en: '/cleaners', sl: '/cistilci' } })
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const userStore = useUserStore()
const fromQuery = () => ({
  ...emptyCleanerFilters(),
  search: String(route.query.search ?? ''),
  city: String(route.query.city ?? ''),
  maximumRate: route.query.maximumRate ? Number(route.query.maximumRate) : null,
  maximumMinimumPrice: route.query.maximumMinimumPrice ? Number(route.query.maximumMinimumPrice) : null,
  minimumRating: route.query.minimumRating ? Number(route.query.minimumRating) : null,
  weekend: route.query.weekend === 'true',
  sameDay: route.query.sameDay === 'true',
  supplies: route.query.supplies === 'true',
  transportation: route.query.transportation === 'true',
  language: String(route.query.language ?? ''),
})
const filters = ref(fromQuery())
const sort = ref<CleanerSort>((route.query.sort as CleanerSort)
  || (filters.value.search ? 'relevance' : 'newest'))
const page = ref(Number(route.query.page) || 1)
const pageSize = 9
const drawerOpen = ref(false)
let queryTimer: ReturnType<typeof setTimeout> | undefined
const searchCriteria = () => ({
  search: filters.value.search,
  page: page.value,
  pageSize,
  sort: sort.value,
  ...(filters.value.city && { cityCode: filters.value.city }),
  ...(filters.value.maximumRate !== null && {
    maximumHourlyRate: filters.value.maximumRate,
  }),
  ...(filters.value.maximumMinimumPrice !== null && {
    maximumMinimumPrice: filters.value.maximumMinimumPrice,
  }),
  ...(filters.value.minimumRating !== null && {
    minimumRating: filters.value.minimumRating,
  }),
  ...(filters.value.weekend && { weekendAvailable: true }),
  ...(filters.value.sameDay && { sameDayAvailable: true }),
  ...(filters.value.supplies && { bringsSupplies: true }),
  ...(filters.value.transportation && { ownTransportation: true }),
  ...(filters.value.language && { language: filters.value.language }),
})
await Promise.all([
  userStore.searchCleaners(searchCriteria()),
  userStore.loadCities(),
])
const filteredCleaners = computed(() => userStore.cleaners)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(userStore.cleanerSearchTotal / pageSize)))
const pagedCleaners = computed(() => filteredCleaners.value)
const hasIllustrativeProfiles = computed(() => pagedCleaners.value.some((cleaner) => cleaner.isDemo))
const cityOptions = computed(() => userStore.cities.map((city) => ({ label: city.name, value: city.code })))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const sortOptions = computed(() => (['relevance', 'rating', 'rate', 'completed', 'newest'] as CleanerSort[])
  .map((value) => ({ value, label: t(`cleaners.sort.${value}`) })))
const activeChips = computed(() => Object.entries(filters.value)
  .filter(([, value]) => value !== '' && value !== null && value !== false)
  .map(([key, value]) => ({
    key,
    label: key === 'city' ? cityName(String(value)) : t(`cleaners.filterLabels.${key}`, { value }),
  })))
watch([filters, sort, page], () => {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(async () => {
    await Promise.all([
      router.replace({
        query: serializeQuery({ ...filters.value, sort: sort.value, page: page.value > 1 ? page.value : null }),
      }),
      userStore.searchCleaners(searchCriteria()),
    ])
  }, 250)
}, { deep: true })
watch([filters, sort], () => page.value = 1, { deep: true })
watch(() => filters.value.search, (search) => {
  if (search && sort.value === 'newest') sort.value = 'relevance'
  if (!search && sort.value === 'relevance') sort.value = 'newest'
})
watch(totalPages, (value) => page.value = Math.min(page.value, value))
const resetFilters = () => {
  filters.value = emptyCleanerFilters()
  sort.value = 'newest'
}
const removeFilter = (key: string) => {
  const defaults = emptyCleanerFilters()
  filters.value = { ...filters.value, [key]: defaults[key as keyof typeof defaults] }
}
usePublicSeo({
  title: computed(() => t('cleaners.metaTitle')),
  description: computed(() => t('cleaners.metaDescription')),
  path: computed(() => getAppRoute('cleaners', locale.value)),
})
useHead({
  script: [{
    type: 'application/ld+json',
    textContent: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'itemListElement': pagedCleaners.value.filter((cleaner) => !cleaner.isDemo).map((cleaner, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': `${cleaner.firstName} ${cleaner.lastName}`,
        'url': new URL(
          getCleanerRoute(cleaner.id, locale.value),
          String(config.public.siteUrl),
        ).href,
      })),
    })),
  }],
})
</script>

<style scoped lang="scss">
.catalog-page {
  background: $color-background;

  &__hero {
    padding-block: $space-12;
    background: $color-surface;
    border-bottom: 1px solid $color-border;

    p {
      font-size: $font-size-xs;
      font-weight: $font-weight-bold;
      color: $color-primary;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    h1 {
      margin-block: $space-2 $space-3;
      font-size: $font-size-3xl;
    }

    span {
      color: $color-text-secondary;
    }
  }

  &__body {
    display: grid;
    gap: $space-8;
    padding-block: $space-10 $space-20;
  }

  &__sidebar {
    display: none;
    align-self: start;
    padding: $space-5;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
  }

  &__results {
    display: grid;
    gap: $space-6;
    min-width: 0;
  }

  &__disclosure {
    padding: $space-3 $space-4;
    font-size: $font-size-xs;
    line-height: 1.5;
    color: $color-text-secondary;
    background: rgba($color-primary, 0.05);
    border-left: 3px solid rgba($color-primary, 0.35);
    border-radius: $radius-md;
  }

  &__toolbar {
    display: grid;
    gap: $space-4;
    align-items: end;
    min-width: 0;
  }

  &__grid {
    display: grid;
    gap: $space-5;
    min-width: 0;
  }

  @media (min-width: $breakpoint-md) {
    &__toolbar {
      grid-template-columns: minmax(0, 1fr) minmax(13rem, 16rem) auto;
    }

    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__body {
      grid-template-columns: 18rem minmax(0, 1fr);
    }

    &__sidebar {
      display: block;
    }

    &__filter-button {
      display: none;
    }

    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: $breakpoint-xl) {
    &__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}
</style>
