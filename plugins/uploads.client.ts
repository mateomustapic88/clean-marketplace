import { createAppBrowserSupabaseClient } from '~/infrastructure/supabase/browserClient'
import { MockUploadAdapter } from '~/services/uploads/MockUploadAdapter'
import { SupabaseUploadService } from '~/services/uploads/SupabaseUploadService'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const uploads = config.public.infrastructureMode === 'supabase'
    ? new SupabaseUploadService(createAppBrowserSupabaseClient())
    : new MockUploadAdapter()
  return { provide: { uploads } }
})
