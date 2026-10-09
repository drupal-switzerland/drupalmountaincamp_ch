import { registerEndpoint } from '@nuxt/test-utils/runtime'

// Plugins query these during app init. Without a backend they 404 and Nuxt
// logs NUXT_E1005, so answer them with empty data.
const APP_INIT_QUERIES = ['initData', 'drupalUser']

if (typeof window !== 'undefined') {
  for (const name of APP_INIT_QUERIES) {
    registerEndpoint(`/api/graphql/query/${name}`, () => ({ data: {} }))
  }
}
