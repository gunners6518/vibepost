// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (only available on server-side)
    cronSecret: process.env.CRON_SECRET || '',
    // Support both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL for compatibility
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    typefullyApiKey: process.env.TYPEFULLY_API_KEY || '',
    typefullySocialSetId: process.env.TYPEFULLY_SOCIAL_SET_ID || ''
  },

  // Make sure runtimeConfig is properly typed
  nitro: {
    experimental: {
      wasm: true
    }
  },

  modules: ["@nuxtjs/tailwindcss"]
})