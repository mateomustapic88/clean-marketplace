<template>
  <div class="default-layout">
    <a class="default-layout__skip-link" href="#main-content">
      {{ t('navigation.skipToContent') }}
    </a>
    <PublicHeader />
    <main id="main-content" class="default-layout__main" tabindex="-1">
      <slot />
    </main>
    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import PublicFooter from '~/components/public/PublicFooter.vue'
import PublicHeader from '~/components/public/PublicHeader.vue'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.default-layout {
  display: flex;
  min-height: 100vh;
  flex-direction: column;

  &__skip-link {
    position: fixed;
    top: $space-3;
    left: $space-3;
    z-index: calc($z-modal + 1);
    padding: $space-3 $space-4;
    font-weight: $font-weight-semibold;
    color: $color-surface;
    text-decoration: none;
    pointer-events: none;
    background: $color-primary-dark;
    border-radius: $radius-md;
    opacity: 0;
    transform: translateY(-150%);

    &:focus {
      pointer-events: auto;
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__main {
    flex: 1;
    outline: none;
  }
}
</style>
