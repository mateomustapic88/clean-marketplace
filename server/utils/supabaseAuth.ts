import { createError, type H3Event } from 'h3'
import type { User } from '~/domains/users/types'
import { createServerSupabaseClient } from '~/infrastructure/supabase/serverClient'

export const requireSupabaseUser = async (event: H3Event): Promise<User> => {
  const supabase = createServerSupabaseClient(event)
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status, display_name, avatar_path, is_demo, created_at, updated_at')
    .eq('id', authData.user.id)
    .single()
  if (profileError || !profile || profile.status !== 'active') {
    throw createError({ statusCode: 403, statusMessage: 'Account is not authorized' })
  }
  return {
    id: profile.id,
    email: authData.user.email ?? '',
    displayName: profile.display_name,
    role: profile.role,
    status: profile.status,
    avatarSeed: profile.avatar_path ?? profile.id,
    isDemo: profile.is_demo,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}
