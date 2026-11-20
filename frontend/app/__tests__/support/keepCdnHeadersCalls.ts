import { defineNuxtModule } from '@nuxt/kit'

/**
 * nuxt-multi-cache removes useCDNHeaders calls from client builds. The build
 * vitest runs is one, so the tests would not see the calls to check them.
 */
export default defineNuxtModule({
  meta: { name: 'keep-cdn-headers-calls' },
  setup(_, nuxt) {
    nuxt.hook('modules:done', () => {
      const client = nuxt.options.optimization.treeShake.composables.client
      for (const [path, names] of Object.entries(client)) {
        client[path] = names.filter((name) => name !== 'useCDNHeaders')
      }
    })
  },
})
