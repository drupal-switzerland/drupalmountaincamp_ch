import { defineNuxtPlugin } from 'nuxt/app'
import type { DrupalMessage } from '~/composables/useDrupalMessages'
import type { GraphqlResponseTyped } from '#nuxt-graphql-middleware/response'

type GraphqlMessengerMessage = {
  type: string
  message: string
  escaped: string
  safe: string
}

/**
 * Try to extract the messages from a GraphQL query or mutation.
 */
function extractMessages(data: GraphqlResponseTyped): DrupalMessage[] {
  if (data.data && 'messengerMessages' in data.data) {
    return data.data.messengerMessages.map((v: GraphqlMessengerMessage) => {
      return {
        type: v.type,
        message: v.safe,
      }
    })
  }

  return []
}

/**
 * This is only called when performing a query or mutation from within the nuxt
 * app (e.g. not via custom server routes).
 */
export default defineNuxtPlugin(() => {
  const state = useGraphqlState()
  const { messages } = useDrupalMessages()
  const language = useCurrentLanguage()
  const config = useRuntimeConfig()

  if (!state) {
    return
  }

  state.fetchOptions = {
    /**
     * Interceptor called whenever a GraphQL response arrives.
     */
    onResponse(result) {
      const data = result.response?._data
      if (!data) {
        return
      }

      // Extract drupal messages from every GraphQL response.
      extractMessages(data).forEach((v) => {
        const exists = messages.value.find((m) => m.message === v.message)
        if (!exists) {
          messages.value.push(v)

          // When there are messages, we have to make the whole request uncacheable.
          useCDNHeaders((v) => v.private())
        }
      })

      if (import.meta.server) {
        const event = useRequestEvent()

        useCDNHeaders((helper) => {
          if (!data.__cacheability?.isCacheable) {
            helper.private()
            return
          }

          helper
            .public()
            .setNumeric('maxAge', data.__cacheability.maxAge)
            .addTags(data.__cacheability.tagsCdn)
        }, event)
      }
    },

    onRequest({ options, request }) {
      if (import.meta.server && import.meta.dev) {
        console.log('GraphQL Query: ' + request)
      }
      try {
        if (!options.params) {
          options.params = {}
        }

        // Add the build hash to every GraphQL request.
        // We do this so that after a deployment, if the user is using the
        // "new" version of the app, the request URL issued is now different
        // than the previous one and thus will not be served from cache.
        options.params.__h = config.public.buildHash

        // Add the current language to the URL
        options.params.__l = language.value

        if (import.meta.server) {
          options.params.__server = 'true'
        }

        const requestHeaders = useRequestHeaders()
        Object.keys(requestHeaders).forEach((key) => {
          const value = requestHeaders[key]
          if (value != null) {
            const headerValue = Array.isArray(value) ? value.join(', ') : value
            options.headers?.append(key, headerValue)
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Do nothing.
      }
    },
  }
})
