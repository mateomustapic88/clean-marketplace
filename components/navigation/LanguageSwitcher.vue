<template>
  <div class="language-switcher" role="group" :aria-label="t('language.label')">
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      class="language-switcher__option"
      :class="{ 'language-switcher__option--active': locale === item.code }"
      :to="switchLocalePath(item.code)"
      :lang="item.code"
      :hreflang="item.code"
      :aria-label="t('language.switchTo', { language: item.name })"
      :aria-current="locale === item.code ? 'true' : undefined"
    >
      {{ t(`language.${item.code}`) }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<style scoped lang="scss">
.language-switcher {
  display: inline-flex;
  padding: 0.2rem;
  background: $color-background;
  border: 1px solid $color-border;
  border-radius: $radius-full;

  &__option {
    display: grid;
    min-width: 2.3rem;
    min-height: 2.3rem;
    padding: $space-1 $space-2;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: $color-text-secondary;
    text-decoration: none;
    place-items: center;
    border-radius: $radius-full;

    &--active {
      color: $color-surface;
      pointer-events: none;
      background: $color-primary-dark;
    }
  }
}
</style>
