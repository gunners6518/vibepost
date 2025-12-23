// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (only available on server-side)
    // These are server-only and will not be exposed to the client
    cronSecret: process.env.CRON_SECRET || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    typefullyApiKey: process.env.TYPEFULLY_API_KEY || '',
    typefullySocialSetId: process.env.TYPEFULLY_SOCIAL_SET_ID || ''
  },

  // Nitro configuration for server-side rendering
  nitro: {
    experimental: {
      wasm: true
    },
    // Preset for Vercel deployment (auto-detected, but explicit is better)
    preset: 'vercel'
  },

  modules: ["@nuxtjs/tailwindcss"]
})