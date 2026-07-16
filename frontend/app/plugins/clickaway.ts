import { directive } from 'vue3-click-away'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-away', {
    ...directive,
    // Necessary for the directive to work at all.
    getSSRProps() {
      return {}
    },
  })
})
