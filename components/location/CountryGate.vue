<template>
  <Teleport to="body">
    <div
      v-if="marketplaceStore.initialized && !locationConfirmed"
      class="country-gate"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
    >
      <div ref="panel" class="country-gate__panel" tabindex="-1">
        <AppLogo />
        <div v-if="!pendingCountryCode">
          <p class="country-gate__eyebrow">{{ t('countryGate.eyebrow') }}</p>
          <h1 :id="titleId">{{ t('countryGate.title') }}</h1>
          <p :id="descriptionId" class="country-gate__description">
            {{ t('countryGate.description') }}
          </p>
        </div>
        <div v-if="!pendingCountryCode" class="country-gate__options">
          <button
            v-for="countryCode in countryCodes"
            :key="countryCode"
            class="country-gate__option"
            type="button"
            @click="chooseCountry(countryCode)"
          >
            <span class="country-gate__flag" aria-hidden="true">
              {{ countryCode === 'HR' ? '🇭🇷' : '🇺🇸' }}
            </span>
            <span>
              <strong>{{ t(`countries.${countryCode}.name`) }}</strong>
              <small>{{ t(`countries.${countryCode}.description`) }}</small>
            </span>
            <ArrowRight :size="20" aria-hidden="true" />
          </button>
        </div>
        <div v-else class="country-gate__city-step">
          <button class="country-gate__back" type="button" @click="pendingCountryCode = null">
            <ArrowLeft :size="17" aria-hidden="true" />{{ t('countryGate.back') }}
          </button>
          <div>
            <p class="country-gate__eyebrow">{{ t(`countries.${pendingCountryCode}.name`) }}</p>
            <h1 :id="titleId">{{ t('countryGate.cityTitle') }}</h1>
            <p :id="descriptionId" class="country-gate__description">{{ t('countryGate.cityDescription') }}</p>
          </div>
          <div class="country-gate__cities" :aria-busy="userStore.isLoading">
            <button class="country-gate__city" type="button" @click="confirmLocation(null)">
              <MapPinned :size="18" aria-hidden="true" />
              <span>{{ t('countryGate.allCities') }}</span>
            </button>
            <button
              v-for="city in userStore.cities"
              :key="city.code"
              class="country-gate__city"
              type="button"
              @click="confirmLocation(city.code)"
            >
              <MapPin :size="18" aria-hidden="true" />
              <span>{{ marketplaceCityLabel(city) }}</span>
            </button>
          </div>
        </div>
        <p class="country-gate__note">{{ t('countryGate.note') }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, MapPin, MapPinned } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import AppLogo from '~/components/layout/AppLogo.vue'
import { marketplaceCityLabel } from '~/config/marketplaces'
import type { CountryCode } from '~/domains/shared/types'
import { useMarketplaceStore } from '~/stores/marketplace'
import { useUserStore } from '~/stores/user'

const { t } = useI18n()
const marketplaceStore = useMarketplaceStore()
const userStore = useUserStore()
const { locationConfirmed, selectedCountryCode } = storeToRefs(marketplaceStore)
const panel = ref<HTMLElement | null>(null)
const active = computed(() => marketplaceStore.initialized && !locationConfirmed.value)
const pendingCountryCode = ref<CountryCode | null>(selectedCountryCode.value)
const countryCodes: CountryCode[] = ['HR', 'US']
const titleId = useId()
const descriptionId = useId()

useFocusTrap(panel, active)
useBodyScrollLock(active)

const chooseCountry = async (countryCode: CountryCode) => {
  pendingCountryCode.value = countryCode
  await userStore.loadCities(countryCode, true)
}
const confirmLocation = (cityCode: string | null) => {
  if (!pendingCountryCode.value) return
  marketplaceStore.selectLocation(pendingCountryCode.value, cityCode)
}

watch(locationConfirmed, async (confirmed) => {
  if (confirmed) return
  pendingCountryCode.value = selectedCountryCode.value
  if (pendingCountryCode.value) await userStore.loadCities(pendingCountryCode.value, true)
})
</script>

<style scoped lang="scss">
.country-gate {
  position: fixed;
  z-index: calc($z-modal + 2);
  display: grid;
  padding: $space-5;
  background: rgba($color-text-primary, 0.62);
  inset: 0;
  place-items: center;
  backdrop-filter: blur(10px);

  &__panel {
    display: grid;
    width: min(100%, 42rem);
    max-height: calc(100vh - #{$space-10});
    gap: $space-8;
    padding: clamp($space-6, 5vw, $space-10);
    overflow-y: auto;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-lg;
  }

  &__eyebrow {
    margin-bottom: $space-2;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  h1 {
    margin-bottom: $space-3;
    font-size: $font-size-3xl;
  }

  &__description,
  &__note {
    color: $color-text-secondary;
  }

  &__options {
    display: grid;
    gap: $space-3;
  }

  &__city-step {
    display: grid;
    gap: $space-5;
  }

  &__back {
    display: inline-flex;
    gap: $space-2;
    align-items: center;
    width: fit-content;
    padding: 0;
    font: inherit;
    color: $color-primary;
    cursor: pointer;
    background: none;
    border: 0;
  }

  &__cities {
    display: grid;
    max-height: 18rem;
    gap: $space-2;
    overflow-y: auto;
  }

  &__city {
    display: flex;
    gap: $space-3;
    align-items: center;
    padding: $space-3 $space-4;
    font: inherit;
    color: $color-text-primary;
    text-align: left;
    cursor: pointer;
    background: $color-background;
    border: 1px solid transparent;
    border-radius: $radius-md;

    &:hover,
    &:focus-visible {
      background: $color-surface;
      border-color: $color-primary;
    }
  }

  &__option {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
    align-items: center;
    width: 100%;
    padding: $space-4;
    color: $color-text-primary;
    text-align: left;
    cursor: pointer;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    transition: border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;

    &:hover,
    &:focus-visible {
      border-color: $color-primary;
      box-shadow: $shadow-md;
      transform: translateY(-1px);
    }

    strong,
    small {
      display: block;
    }

    strong {
      margin-bottom: $space-1;
      font-size: $font-size-lg;
    }

    small {
      color: $color-text-secondary;
    }
  }

  &__flag {
    font-size: 2rem;
  }

  &__note {
    font-size: $font-size-xs;
    text-align: center;
  }
}
</style>
