const legacyKeys = [
  'clean_marketplace_mock_database',
  'clean_marketplace_auth_session',
]

export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.infrastructureMode !== 'supabase') return
  for (const key of legacyKeys) localStorage.removeItem(key)
})
