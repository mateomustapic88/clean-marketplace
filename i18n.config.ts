import en from './locales/en.json'
import hr from './locales/hr.json'
import sl from './locales/sl.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'hr',
  fallbackLocale: 'hr',
  messages: {
    en,
    hr,
    sl,
  },
}))
