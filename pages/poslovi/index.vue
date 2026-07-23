<template>
  <div class="catalog-page">
    <header class="catalog-page__hero">
      <div class="container">
        <Breadcrumbs :items="[{ label: t('navigation.home'), to: getAppRoute('home', locale) }, { label: t('jobs.title') }]" />
        <p>{{ t('jobs.eyebrow') }}</p>
        <h1>{{ t('jobs.title') }}</h1>
        <span>{{ t('jobs.description') }}</span>
      </div>
    </header>
    <div class="catalog-page__body container">
      <aside class="catalog-page__sidebar">
        <JobFilters v-model="filters" :city-options="cityOptions" @reset="resetFilters" />
      </aside>
      <main class="catalog-page__results">
        <div class="catalog-page__toolbar">
          <p>{{ t('catalog.resultCount', { count: filteredJobs.length }) }}</p>
          <BaseSelect v-model="sort" :label="t('catalog.sort')" :options="sortOptions" />
          <BaseButton class="catalog-page__filter-button" variant="secondary" @click="drawerOpen = true">
            <SlidersHorizontal :size="18" />{{ t('catalog.filters') }}
          </BaseButton>
        </div>
        <ActiveFilterChips :items="activeChips" @remove="removeFilter" @clear="resetFilters" />
        <div v-if="jobsStore.isLoading" class="catalog-page__grid" aria-live="polite">
          <JobCardSkeleton v-for="item in pageSize" :key="item" />
        </div>
        <EmptyResults v-else-if="!pagedJobs.length" @reset="resetFilters" />
        <div v-else class="catalog-page__grid">
          <JobCard
            v-for="job in pagedJobs"
            :key="job.id"
            :job="job"
            :city-name="cityName(job.cityCode)"
          />
        </div>
        <PaginationControls v-model="page" :total-pages="totalPages" :label="t('jobs.pagination')" />
      </main>
    </div>
    <FilterDrawer v-model="drawerOpen" :title="t('jobs.filters.title')">
      <JobFilters v-model="filters" :city-options="cityOptions" @reset="resetFilters" />
    </FilterDrawer>
  </div>
</template>

<script setup lang="ts">
import { SlidersHorizontal } from '@lucide/vue'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import {
  emptyJobFilters,
  filterJobs,
  paginate,
  serializeQuery,
  sortJobs,
  type JobSort,
} from '~/utils/publicCatalog'
import { getAppRoute, getJobRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/poslovi', en: '/jobs' } })
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const jobsStore = useJobsStore()
const userStore = useUserStore()
await Promise.all([jobsStore.loadJobs(), userStore.loadDirectory()])

const fromQuery = () => ({
  ...emptyJobFilters(),
  search: String(route.query.search ?? ''),
  city: String(route.query.city ?? ''),
  priceType: String(route.query.priceType ?? ''),
  minimumPrice: route.query.minimumPrice ? Number(route.query.minimumPrice) : null,
  maximumPrice: route.query.maximumPrice ? Number(route.query.maximumPrice) : null,
  minimumSize: route.query.minimumSize ? Number(route.query.minimumSize) : null,
  sameDay: route.query.sameDay === 'true',
  supplies: route.query.supplies === 'true',
  weekend: route.query.weekend === 'true',
  urgent: route.query.urgent === 'true',
  date: String(route.query.date ?? ''),
})
const filters = ref(fromQuery())
const sort = ref<JobSort>((route.query.sort as JobSort) || 'newest')
const page = ref(Number(route.query.page) || 1)
const pageSize = 9
const drawerOpen = ref(false)
let queryTimer: ReturnType<typeof setTimeout> | undefined

const publicJobs = computed(() => jobsStore.jobs.filter((job) =>
  ['published', 'receiving_offers'].includes(job.status)))
const filteredJobs = computed(() => sortJobs(filterJobs(publicJobs.value, filters.value), sort.value))
const totalPages = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize)))
const pagedJobs = computed(() => paginate(filteredJobs.value, page.value, pageSize))
const cityOptions = computed(() => userStore.cities.map((city) => ({ label: city.name, value: city.code })))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const sortOptions = computed(() => (['newest', 'date', 'budget-high', 'budget-low'] as JobSort[])
  .map((value) => ({ value, label: t(`jobs.sort.${value}`) })))
const activeChips = computed(() => Object.entries(filters.value)
  .filter(([, value]) => value !== '' && value !== null && value !== false)
  .map(([key, value]) => ({
    key,
    label: key === 'city' ? cityName(String(value)) : t(`jobs.filterLabels.${key}`, { value }),
  })))

watch([filters, sort, page], () => {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(() => {
    router.replace({
      query: serializeQuery({ ...filters.value, sort: sort.value, page: page.value > 1 ? page.value : null }),
    })
  }, 250)
}, { deep: true })
watch([filters, sort], () => page.value = 1, { deep: true })
watch(totalPages, (value) => page.value = Math.min(page.value, value))

const resetFilters = () => {
  filters.value = emptyJobFilters()
  sort.value = 'newest'
}
const removeFilter = (key: string) => {
  const defaults = emptyJobFilters()
  filters.value = { ...filters.value, [key]: defaults[key as keyof typeof defaults] }
}

usePublicSeo({
  title: computed(() => t('jobs.metaTitle')),
  description: computed(() => t('jobs.metaDescription')),
  path: computed(() => getAppRoute('jobs', locale.value)),
})
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'itemListElement': pagedJobs.value.map((job, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': job.title,
        'url': `https://clean.hr${getJobRoute(job.id, locale.value)}`,
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

  &__toolbar {
    display: grid;
    gap: $space-4;
    align-items: end;
    min-width: 0;

    p {
      font-weight: $font-weight-semibold;
    }
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
