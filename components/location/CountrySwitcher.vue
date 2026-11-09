<template>
  <label class="country-switcher">
    <Globe2 :size="17" aria-hidden="true" />
    <select :value="effectiveCountryCode" :aria-label="t('countrySwitcher.label')" @change="changeCountry">
      <option v-for="countryCode in countryCodes" :key="countryCode" :value="countryCode">
        {{ countryCode === 'HR' ? '🇭🇷' : '🇺🇸' }} {{ t(`countries.${countryCode}.shortName`) }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { Globe2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import type { CountryCode } from '~/domains/shared/types'
import { useMarketplaceStore } from '~/stores/marketplace'

const { t } = useI18n()
const marketplaceStore = useMarketplaceStore()
const { effectiveCountryCode } = storeToRefs(marketplaceStore)
const countryCodes: CountryCode[] = ['HR', 'US']

const changeCountry = (event: Event) => {
  marketplaceStore.requestCountryChange((event.target as HTMLSelectElement).value as CountryCode)
}
</script>

<style scoped lang="scss">
.country-switcher {
  display: inline-flex;
  gap: $space-2;
  align-items: center;
  min-height: 2.75rem;
  padding-inline: $space-3;
  color: $color-text-primary;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-md;

  select {
    max-width: 8.5rem;
    padding: 0;
    font: inherit;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 0;
    outline: 0;
  }
}
</style>
