import { saasConfig } from './config/saas'
import { resolveBillingMode } from './services/billing/billingConfiguration'
import {
  resolveAppBaseUrl,
  resolveInfrastructureMode,
} from './config/infrastructure'

const isProduction = process.env.NODE_ENV === 'production'
const billingMode = resolveBillingMode(process.env.BILLING_MODE, isProduction)
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
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', type: 'image/x-icon', sizes: '64x64', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
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
    resendApiKey: process.env.RESEND_API_KEY || '',
    contactEmailFrom: process.env.CONTACT_EMAIL_FROM || '',
    contactEmailTo: process.env.CONTACT_EMAIL_TO || 'cleanmarketplace.2026@gmail.com',
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
  routeRules: {
    '/': { isr: 900 },
    '/en': { isr: 900 },
    '/sl': { isr: 900 },
    '/ciscenje-apartmana': { isr: true },
    '/en/apartment-cleaning-croatia': { isr: true },
    '/sl/ciscenje-apartmajev-hrvaska': { isr: true },
    '/kako-funkcionira': { isr: true },
    '/en/how-it-works': { isr: true },
    '/sl/kako-deluje': { isr: true },
    '/cijene': { isr: true },
    '/en/pricing': { isr: true },
    '/sl/cene': { isr: true },
    '/kontakt': { isr: true },
    '/en/contact': { isr: true },
    '/sl/kontakt': { isr: true },
    '/politika-privatnosti': { isr: true },
    '/en/privacy': { isr: true },
    '/sl/politika-zasebnosti': { isr: true },
    '/uvjeti-koristenja': { isr: true },
    '/en/terms': { isr: true },
    '/sl/pogoji-uporabe': { isr: true },
    '/politika-kolacica': { isr: true },
    '/en/cookie-policy': { isr: true },
    '/sl/politika-piskotkov': { isr: true },
    '/brochure': { isr: true },
    '/robots.txt': { isr: true },
    '/sitemap.xml': { isr: 3600 },
    '/api/**': { isr: false },
    '/dashboard/**': { isr: false },
    '/dashboard-cleaner/**': { isr: false },
    '/admin/**': { isr: false },
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
    langDir: 'locales',
    defaultLocale: 'hr',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      {
        code: 'hr',
        language: 'hr-HR',
        name: 'Hrvatski',
        file: 'hr.json',
      },
      {
        code: 'en',
        language: 'en-GB',
        name: 'English',
        file: 'en.json',
      },
      {
        code: 'sl',
        language: 'sl-SI',
        name: 'Slovenščina',
        file: 'sl.json',
      },
    ],
    vueI18n: 'i18n.config.ts',
  },
})
