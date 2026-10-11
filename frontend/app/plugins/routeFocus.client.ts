import {
  isNavigationToAnotherPage,
  MAIN_CONTENT_ID,
} from '~/helpers/routeFocus'

/**
 * After a client-side navigation, focus main once the page has rendered. The
 * browser otherwise keeps tabbing from where the activated link used to be.
 * preventScroll leaves the router's scroll position alone.
 */
export default defineNuxtPlugin((nuxtApp) => {
  let focusMainOnFinish = false

  useRouter().afterEach((to, from, failure) => {
    focusMainOnFinish = isNavigationToAnotherPage(to, from, failure)
  })

  nuxtApp.hook('page:finish', () => {
    if (!focusMainOnFinish) {
      return
    }
    focusMainOnFinish = false
    document.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true })
  })
})
