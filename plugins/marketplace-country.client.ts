import { getDefaultMarketplaceLocale, marketplaceLocaleCodes } from '~/config/marketplaces'
import { useMarketplaceStore } from '~/stores/marketplace'

export default defineNuxtPlugin(async () => {
  const marketplaceStore = useMarketplaceStore()
  const { locale, setLocale } = useI18n()
  marketplaceStore.initialize()

  const ensureSupportedLocale = async () => {
    const countryCode = marketplaceStore.effectiveCountryCode
    if (marketplaceLocaleCodes[countryCode].includes(locale.value as 'hr' | 'en')) return
    await setLocale(getDefaultMarketplaceLocale(countryCode))
  }

  await ensureSupportedLocale()
  watch(() => marketplaceStore.effectiveCountryCode, ensureSupportedLocale)
})
