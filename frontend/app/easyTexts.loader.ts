import { defineEasyTextsLoader } from 'nuxt-easy-texts/loader'

export default defineEasyTextsLoader(
  () => {
    const language = useCurrentLanguage()
    return {
      async load() {
        const data = await useInitData()
        return data.value.translations
      },
      reloadTrigger() {
        return computed(() => language.value)
      },
    }
  },
  {
    // initData must go through the GraphQL fetch options (timeouts, the Drupal
    // unavailable guard, cacheability), so they have to be set up first.
    dependsOn: ['graphql-fetch-options'],
  },
)
