<script setup lang="ts">
import { getAppRoute } from '~/utils/routes'

definePageMeta({
  middleware: ['auth', 'role'],
  roles: ['owner'],
})

defineI18nRoute({
  paths: {
    hr: '/vlasnik',
    en: '/owner',
  },
})

const { locale } = useI18n()
await navigateTo(getAppRoute('ownerDashboard', locale.value), { redirectCode: 301 })
</script>
