import { defineGraphqlClientOptions } from 'nuxt-graphql-middleware/client-options'

export default defineGraphqlClientOptions<{
  language: string
  hash: string
  env: 'client' | 'server'
}>({
  buildClientContext() {
    const language = useCurrentLanguage()
    const config = useRuntimeConfig()

    return {
      language: language.value,
      hash: config.public.buildHash,
      env: import.meta.server ? 'server' : 'client',
    }
  },
})
