import type { InjectionKey } from 'vue'

/**
 * Provided by node components: whether their first paragraph starts in the
 * first viewport, so its image may load eagerly with high priority. False
 * where the node renders a hero or top image of its own above it.
 */
export const FIRST_PARAGRAPH_IN_FIRST_VIEWPORT: InjectionKey<boolean> = Symbol(
  'firstParagraphInFirstViewport',
)
