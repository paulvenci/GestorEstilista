// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/supabase'],

  // build: {
  //   transpile: ['@fullcalendar/vue3', '@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction', '@fullcalendar/list']
  // },

  supabase: {
    redirect: false,
  },
  typescript: {
    typeCheck: false
  }
})
