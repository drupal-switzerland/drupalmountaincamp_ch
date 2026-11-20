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
export function extractMessages(data: GraphqlResponseTyped): DrupalMessage[] {
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
 * Adds the messages of a GraphQL response that are not shown yet and returns
 * the ones it added.
 */
export function appendNewMessages(
  messages: DrupalMessage[],
  data: GraphqlResponseTyped,
): DrupalMessage[] {
  const added: DrupalMessage[] = []
  extractMessages(data).forEach((v) => {
    const exists = messages.find((m) => m.message === v.message)
    if (!exists) {
      messages.push(v)
      added.push(v)
    }
  })
  return added
}
