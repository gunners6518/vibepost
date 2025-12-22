import { createClient } from '@supabase/supabase-js'

export const getSupabaseAdmin = (event?: any) => {
  const config = useRuntimeConfig(event)
  
  const supabaseUrl = config.supabaseUrl
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const missing = []
    if (!supabaseUrl) missing.push('SUPABASE_URL')
    if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase configuration is missing',
      data: { 
        error: 'Server configuration error',
        missing: missing,
        message: `Please set the following environment variables: ${missing.join(', ')}`
      }
    })
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
