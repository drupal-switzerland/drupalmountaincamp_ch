import type { NuxtConfig } from '@nuxt/schema'

const IS_DEV = process.env.NODE_ENV === 'development'

const NUXT_BACKEND_URL = process.env.NUXT_BACKEND_URL

const graphqlMiddleware: NuxtConfig['graphqlMiddleware'] = {
  serverApiPrefix: '/api/graphql',
  autoImportPatterns: [
    'app/**/*.{gql,graphql}',
    'server/**/*.{gql,graphql}',
    '!node_modules',
    'node_modules/vuepal/dist/runtime/components/AdminToolbar/query.adminToolbar.graphql',
    'node_modules/vuepal/dist/runtime/components/LocalTasks/query.localTasks.graphql',
    'node_modules/vuepal/dist/runtime/composables/useDrupalRoute/fragment.drupalRoute.graphql',
  ],
  documents: [],
  downloadSchema: IS_DEV,
  graphqlEndpoint: `${NUXT_BACKEND_URL}/graphql`, // If we have Multisite Setup we need to use NUXT_HOST here.
  codegenConfig: {
    output: {
      nullableArrayElements: false,
    },
  },
  codegenSchemaConfig: {
    urlSchemaOptions: {
      headers: {
        'x-drupal-graphql-token': process.env.DRUPAL_GRAPHQL_TOKEN ?? '',
      },
    },
  },
}

export default graphqlMiddleware
