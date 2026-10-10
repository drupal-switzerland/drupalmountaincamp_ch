import { registerShareTags } from '~/helpers/shareTags'

/** On the server and in the browser, so both resolve the same head. */
export default defineNuxtPlugin(() => {
  registerShareTags(injectHead())
})
