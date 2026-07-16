import type { NuxtConfig } from '@nuxt/schema'

export const runtimeConfig: NuxtConfig['runtimeConfig'] = {
  backendUrl: '',
  requestHost: '',
  drupalGraphqlToken: process.env.DRUPAL_GRAPHQL_TOKEN || '',
  elasticsearchUrl: '',
  elasticsearchPrefix: '',
  public: {
    rokkaHost: '',
    imageHash: '',
    buildHash: process.env.CI_COMMIT_SHORT_SHA || 'local',
  },
}
