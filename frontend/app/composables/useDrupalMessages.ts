export type DrupalMessageType = 'status' | 'warning' | 'error'

export type DrupalMessage = {
  /**
   * Possible message types.
   */
  type: DrupalMessageType

  /**
   * The message. May contain HTML.
   */
  message: string
}

export type DrupalMessageComposable = {
  /**
   * The reactive messages from Drupal.
   */
  messages: Ref<DrupalMessage[]>

  /**
   * Remove the message with the given index.
   */
  removeMessage: (index: number) => void

  /**
   * Clear all messages.
   */
  clearMessages: () => void
}

export function useDrupalMessages(): DrupalMessageComposable {
  const messages = useState<DrupalMessage[]>('drupalMessages', () => [])

  const removeMessage = (index: number) =>
    (messages.value = messages.value.filter((_v, i) => i !== index))

  const clearMessages = () => (messages.value = [])

  return { messages, removeMessage, clearMessages }
}
