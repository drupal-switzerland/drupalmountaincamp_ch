import { defineNuxtPlugin } from '#app'
import useDrupalUser from '~/composables/useDrupalUser'

/**
 * Loads data about the current session.
 */
export default defineNuxtPlugin({
  name: 'drupal-user',
  async setup() {
    const drupalUser = useDrupalUser()

    // If the config has already been fetched, return.
    // This is the case when we're client-side, because the config is already
    // shipped via payload from the server.
    if (drupalUser?.value.fetched) {
      return
    }

    const headers = useRequestHeaders()
    const hasSessionCookie = (headers.cookie || '').includes('SSESS')

    // Only query the backend for the user if we have a session cookie.
    if (hasSessionCookie || import.meta.client) {
      // Load the information about the Drupal user.
      const { data } = await useGraphqlQuery('drupalUser')
      if (data && data.currentDrupalUser) {
        drupalUser.value.accessToolbar = data.currentDrupalUser.canAccessToolbar
      }
    }

    drupalUser.value.fetched = true
  },
})
