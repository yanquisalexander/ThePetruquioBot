// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    //viewTransition: true,
  },
  app: {

    head: {
      title: 'Petruquio.LIVE',
      titleTemplate: '%s | Petruquio.LIVE',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1' }
      ],
      htmlAttrs: {
        "data-theme": 'petruquio-live'
      }
    }
  },

  nitro: {
    prerender: {
      failOnError: false
    }
  },
  modules: [
    '@pinia/nuxt',
    '@sidebase/nuxt-auth',
    '@nuxt/ui',
    '@nuxtjs/device',
    '@vueuse/nuxt',
    // '@nuxthq/studio',
    '@nuxt/content',
  ],
  i18n: {
    vueI18n: './i18n.config.ts',
  },
  ui: {
    global: true,
    icons: ['heroicons', 'lucide', 'fa6-brands', 'mdi']
  },
  css: [
    '~/assets/styles/_petruquiolive.css',
  ],
  devtools: { enabled: false },
  typescript: {
    shim: false
  },
  device: {
    refreshOnResize: true
  },
  build: {
    transpile: [

    ]
  },
  auth: {
    provider: {
      type: 'authjs'
    },
    // @ts-ignore
    defaultProvider: 'twitch',
    origin: 'https://petruquiolive.vercel.app',
  },



  routeRules: {
    '/': { prerender: true },
  },
  vite: {
    optimizeDeps: {
      exclude: [
        'monaco-editor',
        'axios',
      ]
    }
  }
})