// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false, // SPA mode for static hosting
  app: {
    baseURL: '/GestorEstilista/',
  },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/supabase'],

  build: {
    transpile: ['@fullcalendar/vue3', '@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction', '@fullcalendar/list']
  },

  nitro: {
    externals: {
      external: ['whatsapp-web.js', 'qrcode-terminal']
    }
  },

  supabase: {
    redirect: false,
  },
  typescript: {
    typeCheck: false
  },
  runtimeConfig: {
    public: {
      appVersion: process.env.npm_package_version || '0.1.0',
      whatsappApiUrl: process.env.WHATSAPP_API_URL || 'https://gestorestilista-production.up.railway.app/GestorEstilista'
    }
  },
  experimental: {
    appManifest: false
  }
})
