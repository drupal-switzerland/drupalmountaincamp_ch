import { defineEasyTextsLoader } from 'nuxt-easy-texts/loader'

export default defineEasyTextsLoader(() => {
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
})
