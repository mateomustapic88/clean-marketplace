import { defineStore } from 'pinia'
import { getMarketplaceCountry, isCountryCode } from '~/config/marketplaces'
import type { CountryCode } from '~/domains/shared/types'

const storageKey = 'clean_marketplace_country'
const cityStorageKey = 'clean_marketplace_city'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const selectedCountryCode = ref<CountryCode | null>(null)
  const selectedCityCode = ref<string | null>(null)
  const locationConfirmed = ref(false)
  const initialized = ref(false)

  const effectiveCountryCode = computed<CountryCode>(() => selectedCountryCode.value ?? 'HR')
  const country = computed(() => getMarketplaceCountry(effectiveCountryCode.value))

  const initialize = () => {
    if (!import.meta.client || initialized.value) return
    const storedCountry = localStorage.getItem(storageKey)
    if (isCountryCode(storedCountry)) {
      selectedCountryCode.value = storedCountry
      selectedCityCode.value = localStorage.getItem(cityStorageKey)
      locationConfirmed.value = true
    }
    initialized.value = true
  }

  const selectLocation = (countryCode: CountryCode, cityCode: string | null) => {
    selectedCountryCode.value = countryCode
    selectedCityCode.value = cityCode
    locationConfirmed.value = true
    initialized.value = true
    if (import.meta.client) {
      localStorage.setItem(storageKey, countryCode)
      if (cityCode) localStorage.setItem(cityStorageKey, cityCode)
      else localStorage.removeItem(cityStorageKey)
    }
  }

  const requestCountryChange = (countryCode: CountryCode) => {
    selectedCountryCode.value = countryCode
    selectedCityCode.value = null
    locationConfirmed.value = false
    initialized.value = true
  }

  return {
    selectedCountryCode,
    selectedCityCode,
    locationConfirmed,
    effectiveCountryCode,
    country,
    initialized,
    initialize,
    selectLocation,
    requestCountryChange,
  }
})
