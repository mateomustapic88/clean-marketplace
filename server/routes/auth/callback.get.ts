import { createServerSupabaseClient } from '~/infrastructure/supabase/serverClient'

export default defineEventHandler(async (event) => {
  const code = getQuery(event).code
  if (typeof code !== 'string' || !code) {
    return sendRedirect(event, '/prijava?confirmation=invalid', 303)
  }
  const supabase = createServerSupabaseClient(event)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return sendRedirect(event, '/prijava?confirmation=invalid', 303)
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', data.user.id)
    .single()
  if (!profile) return sendRedirect(event, '/prijava?confirmation=invalid', 303)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  if (!profile.onboarding_completed) {
    return sendRedirect(event, profile.role === 'owner' ? '/onboarding/vlasnik' : '/onboarding/cistac', 303)
  }
  return sendRedirect(event, profile.role === 'owner' ? '/dashboard' : '/dashboard-cleaner', 303)
})
