export type InfrastructureMode = 'mock' | 'supabase'

export const productionCanonicalUrl = 'https://clean-marketplace.com'

export const resolveInfrastructureMode = (
  requested: string | undefined,
  isProduction: boolean,
  hasSupabaseConfiguration: boolean,
): InfrastructureMode => {
  if (requested && requested !== 'mock' && requested !== 'supabase') {
    throw new Error('INFRASTRUCTURE_MODE must be either "mock" or "supabase"')
  }
  if (requested === 'mock' && isProduction) {
    throw new Error('Mock infrastructure is not allowed in production')
  }
  if (requested === 'mock' || requested === 'supabase') return requested
  return hasSupabaseConfiguration || isProduction ? 'supabase' : 'mock'
}

export const resolveAppBaseUrl = (
  value: string | undefined,
  isProduction: boolean,
): string => {
  const candidate = value || (isProduction ? productionCanonicalUrl : 'http://localhost:3000')
  let url: URL
  try {
    url = new URL(candidate)
  }
  catch {
    throw new Error('APP_BASE_URL must be a valid absolute URL')
  }
  if (isProduction && value && url.protocol !== 'https:') {
    throw new Error('APP_BASE_URL must use HTTPS in production')
  }
  url.pathname = ''
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}
