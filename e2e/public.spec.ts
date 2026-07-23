import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const openHydratedPage = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('opens the homepage and changes language', async ({ page }) => {
  await openHydratedPage(page, '/')
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Pronađite pouzdanu osobu za čišćenje apartmana',
  })).toBeVisible()
  await page.getByRole('link', { name: /English/ }).first().click()
  await expect(page).toHaveURL(/\/en/)
})

test('browses and filters jobs before opening a detail', async ({ page }) => {
  await openHydratedPage(page, '/poslovi')
  await page.getByLabel('Grad').first().selectOption('dubrovnik')
  await expect(page).toHaveURL(/city=dubrovnik/)
  await page.locator('article.job-card').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/poslovi\/job-/)
  await expect(page.getByText('Primjer oglasa').first()).toBeVisible()
})

test('browses cleaners and opens a public profile', async ({ page }) => {
  await openHydratedPage(page, '/cistaci')
  await page.locator('article.cleaner-card').first().getByRole('link').first().click()
  await expect(page).toHaveURL(/\/cistaci\/cleaner-/)
  await expect(page.getByText('Demo profil').first()).toBeVisible()
})

test('opens pricing and registration', async ({ page }) => {
  await openHydratedPage(page, '/cijene')
  await expect(page.getByText('39')).toBeVisible()
  await openHydratedPage(page, '/registracija')
  await expect(page.getByRole('radio', { name: /Vlasnik apartmana/ })).toBeVisible()
})

test('mobile navigation is keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await openHydratedPage(page, '/')
  await page.getByRole('button', { name: 'Izbornik' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})
