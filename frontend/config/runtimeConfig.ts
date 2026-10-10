import { readFileSync } from 'node:fs'
import type { NuxtConfig } from '@nuxt/schema'
import { parseDefaultTexts } from '../app/helpers/easyTextsDefaults'

// English default texts, server-only: rendered when Drupal's texts can't be
// loaded, since the build strips defaults from $texts() calls.
const easyTextsDefaults = parseDefaultTexts(
  readFileSync(
    new URL('../app/queries/translations.graphql', import.meta.url),
    'utf8',
  ),
)

export const runtimeConfig: NuxtConfig['runtimeConfig'] = {
  backendUrl: '',
  requestHost: '',
  drupalGraphqlToken: process.env.DRUPAL_GRAPHQL_TOKEN || '',
  elasticsearchUrl: '',
  elasticsearchPrefix: '',
  easyTextsDefaults,
  public: {
    rokkaHost: '',
    imageHash: '',
  },
}
