// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  vite: {
    build: {
      target: "es2022",
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022",
      },
    },
  },

  runtimeConfig: {
    zero: {
      authSecret: '', // NUXT_ZERO_AUTH_SECRET
    },
    public: {
      zero: {
        server: '', // NUXT_PUBLIC_ZERO_SERVER
      },
    },
  },

  css: [
    '~/assets/css/main.css',
  ],

  modules: ["@vueuse/nuxt"],
})