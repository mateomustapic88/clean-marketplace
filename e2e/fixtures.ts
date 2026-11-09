import { expect, test as base } from '@playwright/test'

const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('clean_marketplace_country', 'HR')
      localStorage.removeItem('clean_marketplace_city')
    })
    await use(page)
  },
})

export { expect, test }
