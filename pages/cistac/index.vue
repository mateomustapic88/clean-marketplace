<script setup lang="ts">
import { getAppRoute } from '~/utils/routes'

definePageMeta({
  middleware: ['auth', 'role'],
  roles: ['cleaner'],
})

defineI18nRoute({
  paths: {
    hr: '/cistac',
    en: '/cleaner',
    sl: '/cistilec',
  },
})

const { locale } = useI18n()
await navigateTo(getAppRoute('cleanerDashboard', locale.value), { replace: true })
</script>
