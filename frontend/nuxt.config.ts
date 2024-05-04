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
    '@pinia-plugin-persistedstate/nuxt',
    '@sidebase/nuxt-auth',
    '@nuxt/ui',
    '@nuxtjs/device',
    '@vueuse/nuxt'
  ],
  device: {
    refreshOnResize: true
  },
  i18n: {
    vueI18n: './i18n.config.ts',
  },
  ui: {
    global: true,
    icons: ['heroicons', 'lucide', 'ph', 'mdi'],
  },
  css: [
    '~/assets/styles/_petruquiolive.css',
    '@fortawesome/fontawesome-svg-core/styles.css'
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
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/vue-fontawesome',
    ]
  },
  auth: {
    provider: {
      type: 'authjs'
    },
    // @ts-ignore
    defaultProvider: 'twitch',
    origin: 'https://petruquio.live',
  },



  routeRules: {
    '/': { prerender: true },
  }
})
