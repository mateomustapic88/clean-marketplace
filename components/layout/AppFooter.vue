<template>
  <footer class="app-footer">
    <div class="app-footer__main container">
      <div class="app-footer__brand">
        <AppLogo />
        <p>{{ t('footer.description') }}</p>
        <BaseBadge variant="primary">{{ t('footer.phaseNotice') }}</BaseBadge>
      </div>
      <div
        v-for="group in groups"
        :key="group.title"
        class="app-footer__group"
      >
        <h2 class="app-footer__title">{{ t(group.title) }}</h2>
        <ul class="app-footer__list">
          <li v-for="item in group.items" :key="item.key">
            <a :href="item.href" class="app-footer__link">{{ t(item.key) }}</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="app-footer__bottom">
      <div class="app-footer__bottom-inner container">
        <p>© {{ year }} {{ t('meta.siteName') }}. {{ t('footer.rights') }}</p>
        <LanguageSwitcher />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import AppLogo from '~/components/layout/AppLogo.vue'
import LanguageSwitcher from '~/components/navigation/LanguageSwitcher.vue'

const { t } = useI18n()
const year = new Date().getFullYear()
const groups = [
  {
    title: 'footer.product',
    items: [
      { key: 'footer.howItWorks', href: '#foundation' },
      { key: 'footer.pricing', href: '#next' },
      { key: 'footer.jobs', href: '#components' },
      { key: 'footer.cleaners', href: '#components' },
    ],
  },
  {
    title: 'footer.support',
    items: [
      { key: 'footer.contact', href: '#next' },
      { key: 'footer.help', href: '#foundation' },
    ],
  },
  {
    title: 'footer.legal',
    items: [
      { key: 'footer.terms', href: '#next' },
      { key: 'footer.privacy', href: '#next' },
    ],
  },
]
</script>

<style scoped lang="scss">
.app-footer {
  color: rgba($color-surface, 0.76);
  background: $color-primary-dark;

  &__main {
    display: grid;
    gap: $space-10;
    padding-block: $space-16;
  }

  &__brand {
    display: grid;
    gap: $space-5;
    align-content: start;
    max-width: 25rem;

    :deep(.app-logo) {
      color: $color-surface;
    }
  }

  &__title {
    margin-bottom: $space-4;
    font-size: $font-size-sm;
    color: $color-surface;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__list {
    display: grid;
    gap: $space-3;
    padding: 0;
    list-style: none;
  }

  &__link {
    font-size: $font-size-sm;
    text-decoration: none;

    &:hover {
      color: $color-surface;
      text-decoration: underline;
    }
  }

  &__bottom {
    border-top: 1px solid rgba($color-surface, 0.12);
  }

  &__bottom-inner {
    display: flex;
    flex-wrap: wrap;
    gap: $space-4;
    align-items: center;
    justify-content: space-between;
    padding-block: $space-5;
    font-size: $font-size-xs;
  }
}

@media (min-width: $breakpoint-md) {
  .app-footer {
    &__main {
      grid-template-columns: minmax(16rem, 2fr) repeat(3, 1fr);
    }
  }
}
</style>
