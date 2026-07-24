import { saasConfig } from './config/saas'
import { parseBillingMode } from './services/billing/billingConfiguration'
import {
  resolveAppBaseUrl,
  resolveInfrastructureMode,
} from './config/infrastructure'

const billingMode = parseBillingMode(process.env.BILLING_MODE)
const isProduction = process.env.NODE_ENV === 'production'
const hasSupabaseConfiguration = Boolean(
  process.env.NUXT_PUBLIC_SUPABASE_URL
  && process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  && process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY,
)

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vercel/analytics/nuxt',
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
    supabaseServiceRoleKey: process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeOwnerMonthlyPriceId: process.env.STRIPE_OWNER_MONTHLY_PRICE_ID || '',
    stripeOwnerAnnualPriceId: process.env.STRIPE_OWNER_ANNUAL_PRICE_ID || '',
    stripeCleanerMonthlyPriceId: process.env.STRIPE_CLEANER_MONTHLY_PRICE_ID || '',
    stripeCleanerAnnualPriceId: process.env.STRIPE_CLEANER_ANNUAL_PRICE_ID || '',
    public: {
      siteUrl: resolveAppBaseUrl(process.env.APP_BASE_URL, isProduction),
      infrastructureMode: resolveInfrastructureMode(
        process.env.INFRASTRUCTURE_MODE,
        isProduction,
        hasSupabaseConfiguration,
      ),
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabasePublishableKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      billingMode,
      billingEnvironment: {
        webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        development: process.env.NODE_ENV !== 'production',
      },
      plans: {
        owner: {
          monthlyAmount: saasConfig.plans.owner.monthlyAmount,
          annualAmount: saasConfig.plans.owner.annualAmount,
          currency: saasConfig.currency,
          trialDays: saasConfig.trialDays,
        },
        cleaner: {
          monthlyAmount: saasConfig.plans.cleaner.monthlyAmount,
          annualAmount: saasConfig.plans.cleaner.annualAmount,
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
      {
        code: 'sl',
        language: 'sl-SI',
        name: 'Slovenščina',
      },
    ],
    vueI18n: 'i18n.config.ts',
  },
})
