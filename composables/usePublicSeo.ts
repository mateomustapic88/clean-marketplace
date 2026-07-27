import { productionCanonicalUrl } from '~/config/infrastructure'

interface PublicSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  path: MaybeRefOrGetter<string>
  type?: 'website' | 'article'
  index?: MaybeRefOrGetter<boolean>
}

export const usePublicSeo = (options: PublicSeoOptions) => {
  const config = useRuntimeConfig()
  const { locale, t } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const baseUrl = computed(() => String(config.public.siteUrl || productionCanonicalUrl))
  const canonical = computed(() => new URL(toValue(options.path), baseUrl.value).href)
  const socialImage = computed(() => new URL(
    '/images/clean-apartment-cleaning-og.png',
    baseUrl.value,
  ).href)
  const shouldIndex = computed(() => options.index === undefined
    ? true
    : toValue(options.index))

  useSeoMeta({
    title: () => toValue(options.title),
    description: () => toValue(options.description),
    robots: () => shouldIndex.value
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, follow',
    ogTitle: () => toValue(options.title),
    ogDescription: () => toValue(options.description),
    ogType: options.type ?? 'website',
    ogLocale: () => locale.value === 'en' ? 'en_GB' : locale.value === 'sl' ? 'sl_SI' : 'hr_HR',
    ogSiteName: () => 'Clean Marketplace',
    ogUrl: () => canonical.value,
    ogImage: () => socialImage.value,
    ogImageAlt: () => t('meta.socialImageAlt'),
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterTitle: () => toValue(options.title),
    twitterDescription: () => toValue(options.description),
    twitterImage: () => socialImage.value,
    twitterImageAlt: () => t('meta.socialImageAlt'),
  })

  useHead({
    link: () => [
      { rel: 'canonical', href: canonical.value },
      {
        rel: 'alternate',
        hreflang: 'hr-HR',
        href: new URL(switchLocalePath('hr'), baseUrl.value).href,
      },
      {
        rel: 'alternate',
        hreflang: 'en-GB',
        href: new URL(switchLocalePath('en'), baseUrl.value).href,
      },
      {
        rel: 'alternate',
        hreflang: 'sl-SI',
        href: new URL(switchLocalePath('sl'), baseUrl.value).href,
      },
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: new URL(switchLocalePath('hr'), baseUrl.value).href,
      },
    ],
  })
}
