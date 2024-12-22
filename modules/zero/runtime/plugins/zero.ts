import { Zero } from "@rocicorp/zero"

// @ts-ignore
import { schema } from '#build/zero-schema.app.ts'
import { decodeJwt } from "jose"

export default defineNuxtPlugin({
  name: 'zero',
  async setup(nuxtApp) {
    const { server } = useRuntimeConfig().public.zero

    const encodedJWT = useCookie('jwt')
    const decodedJWT = encodedJWT.value && decodeJwt(encodedJWT.value);
    const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : "anon";

    // nuxtApp.hook('app:mounted', () => {
    const z = import.meta.server ? undefined : new Zero({
      userID,
      auth: () => encodedJWT.value || undefined,
      server,
      schema,
      // This is often easier to develop with if you're frequently changing
      // the schema. Switch to 'idb' for local-persistence.
      kvStore: "mem",
    })
    // nuxtApp.provide('z', z)
    // })



    return {
      provide: {
        z,
      },
    }
  }
})


// // `nuxt/kit` is a helper subpath import you can use when defining local modules
// // that means you do not need to add `@nuxt/kit` to your project's dependencies


// export default defineNuxtModule({
//   meta: {
//     name: 'zero'
//   },
//   async setup() {
//   }
// })
