// `nuxt/kit` is a helper subpath import you can use when defining local modules
// that means you do not need to add `@nuxt/kit` to your project's dependencies
import { createResolver, defineNuxtModule, addPlugin, addTemplate } from 'nuxt/kit'
import fs from 'node:fs'

export interface ModuleOptions {
  /**
   * Path to Zero database schema definition file
   * @default '~/zero-schema.ts'
   * @type string
   */
  schema?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'zero',
    configKey: 'zero',
  },
  defaults: {
    schema: '~/zero-schema.ts',
  },
  async setup(options, nuxt) {
    const { resolve, resolvePath } = createResolver(import.meta.url)

    addTemplate({
      filename: 'zero-schema.app.ts',
      getContents: async () => {
        if (options.schema) {
          // resolvePath is used to minify user input error.
          const path = await resolvePath(options.schema)
          const basePath = await resolvePath('~~') // ~~ should be the base path in a nuxt project.

          if (fs.existsSync(path)) {
            // we are replacing the basePath with ../.. to move back to the root (~~) directory.
            return `export * from '${path.replace(basePath, '../..')}'`
          }
        }

        return `export type Schema = unknown; export const schema = undefined as Schema;`
      },
    })

    addPlugin(resolve('./runtime/plugins', 'zero'))

    // Add supabase composables
    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolve('./runtime/composables'))
    })
  },
})
