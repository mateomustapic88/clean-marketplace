import { saasConfig } from './config/saas'
import { parseBillingMode } from './services/billing/billingConfiguration'

const billingMode = parseBillingMode(process.env.BILLING_MODE)

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  app: {
    head: {
      htmlAttrs: {
        lang: 'hr',
      },
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#173B3F' },
        { name: 'color-scheme', content: 'light' },
      ],
    },
  },
  css: [
    '@fontsource-variable/montserrat/index.css',
    '~/assets/scss/main.scss',
  ],
  runtimeConfig: {
    authSessionSecret: process.env.AUTH_SESSION_SECRET || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeOwnerPriceId: process.env.STRIPE_OWNER_PRICE_ID || '',
    stripeCleanerPriceId: process.env.STRIPE_CLEANER_PRICE_ID || '',
    public: {
      siteUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
      billingMode,
      billingEnvironment: {
        webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        development: process.env.NODE_ENV !== 'production',
      },
      plans: {
        owner: {
          monthlyAmount: saasConfig.plans.owner.monthlyAmount,
          currency: saasConfig.currency,
          trialDays: saasConfig.trialDays,
        },
        cleaner: {
          monthlyAmount: saasConfig.plans.cleaner.monthlyAmount,
          currency: saasConfig.currency,
          trialDays: saasConfig.trialDays,
        },
      },
    },
  },
  compatibilityDate: '2025-12-15',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/abstracts" as *;',
        },
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  i18n: {
    restructureDir: '.',
    defaultLocale: 'hr',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      {
        code: 'hr',
        language: 'hr-HR',
        name: 'Hrvatski',
      },
      {
        code: 'en',
        language: 'en-GB',
        name: 'English',
      },
    ],
    vueI18n: 'i18n.config.ts',
  },
})
