import type { NuxtConfig } from '@nuxt/schema'

export const runtimeConfig: NuxtConfig['runtimeConfig'] = {
  backendUrl: '',
  requestHost: '',
  drupalGraphqlToken: process.env.DRUPAL_GRAPHQL_TOKEN || '',
  public: {
    rokkaHost: '',
    imageHash: '',
  },
}
