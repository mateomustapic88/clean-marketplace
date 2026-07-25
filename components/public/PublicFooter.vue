<template>
  <footer class="public-footer">
    <div class="public-footer__main container">
      <div class="public-footer__brand">
        <AppLogo />
        <p>{{ t('footer.description') }}</p>
      </div>
      <nav v-for="group in groups" :key="group.title" :aria-label="group.title">
        <h2>{{ group.title }}</h2>
        <NuxtLink v-for="item in group.items" :key="item.label" :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
    <div class="public-footer__bottom">
      <div class="container">
        <p>{{ t('footer.copyright', { year }) }}</p>
        <LanguageSwitcher />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import AppLogo from '~/components/layout/AppLogo.vue'
import LanguageSwitcher from '~/components/navigation/LanguageSwitcher.vue'
import { getAppRoute } from '~/utils/routes'

const { t, locale } = useI18n()
const year = new Date().getFullYear()
const groups = computed(() => [
  {
    title: t('footer.product'),
    items: [
      { label: t('navigation.apartmentCleaning'), to: getAppRoute('apartmentCleaning', locale.value) },
      { label: t('navigation.jobs'), to: getAppRoute('jobs', locale.value) },
      { label: t('navigation.cleaners'), to: getAppRoute('cleaners', locale.value) },
      { label: t('navigation.howItWorks'), to: getAppRoute('howItWorks', locale.value) },
      { label: t('navigation.pricing'), to: getAppRoute('pricing', locale.value) },
    ],
  },
  {
    title: t('footer.support'),
    items: [
      { label: t('footer.contactSupport'), to: `${getAppRoute('contact', locale.value)}?topic=support` },
      { label: t('footer.reportBug'), to: `${getAppRoute('contact', locale.value)}?topic=bug` },
      { label: t('footer.suggestFeature'), to: `${getAppRoute('contact', locale.value)}?topic=feature` },
      { label: t('footer.faq'), to: `${getAppRoute('home', locale.value)}#faq` },
    ],
  },
  {
    title: t('footer.legal'),
    items: [
      { label: t('footer.privacy'), to: getAppRoute('privacy', locale.value) },
      { label: t('footer.terms'), to: getAppRoute('terms', locale.value) },
      { label: t('footer.cookies'), to: getAppRoute('cookies', locale.value) },
    ],
  },
])
</script>

<style scoped lang="scss">
.public-footer {
  color: rgba($color-surface, 0.82);
  background: $color-primary-dark;

  &__main {
    display: grid;
    gap: $space-10;
    padding-block: $space-16;

    nav {
      display: grid;
      align-content: start;
      gap: $space-3;
    }

    h2 {
      font-size: $font-size-sm;
      color: $color-surface;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    a {
      width: fit-content;
      color: inherit;
      text-decoration: none;
    }
  }

  &__brand {
    display: grid;
    justify-items: start;
    gap: $space-4;
    max-width: 25rem;
  }

  &__bottom {
    padding-block: $space-5;
    border-top: 1px solid rgba($color-surface, 0.14);

    > div {
      display: flex;
      flex-wrap: wrap;
      gap: $space-4;
      align-items: center;
      justify-content: space-between;
    }
  }

  @media (min-width: $breakpoint-md) {
    &__main {
      grid-template-columns: 2fr repeat(3, 1fr);
    }
  }
}
</style>
