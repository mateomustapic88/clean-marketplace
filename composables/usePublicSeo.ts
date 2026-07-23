interface PublicSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  path: MaybeRefOrGetter<string>
  type?: 'website' | 'article'
}

export const usePublicSeo = (options: PublicSeoOptions) => {
  const config = useRuntimeConfig()
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const baseUrl = computed(() => String(config.public.siteUrl || 'https://clean.hr'))
  const canonical = computed(() => new URL(toValue(options.path), baseUrl.value).href)

  useSeoMeta({
    title: () => toValue(options.title),
    description: () => toValue(options.description),
    ogTitle: () => toValue(options.title),
    ogDescription: () => toValue(options.description),
    ogType: options.type ?? 'website',
    ogLocale: () => locale.value === 'en' ? 'en_GB' : 'hr_HR',
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
        hreflang: 'x-default',
        href: new URL(switchLocalePath('hr'), baseUrl.value).href,
      },
    ],
  })
}
