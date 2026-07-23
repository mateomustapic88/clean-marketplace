import en from './locales/en.json'
import hr from './locales/hr.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'hr',
  fallbackLocale: 'hr',
  messages: {
    en,
    hr,
  },
}))
