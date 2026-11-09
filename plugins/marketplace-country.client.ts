import { useMarketplaceStore } from '~/stores/marketplace'

export default defineNuxtPlugin(() => {
  useMarketplaceStore().initialize()
})
