import type { ComputedRef, InjectionKey } from 'vue'

export type TeaserHeading = 'h2' | 'h3'

/** Provided by the Teaser List paragraph: the heading element of its teasers. */
export const TEASER_HEADING: InjectionKey<ComputedRef<TeaserHeading>> =
  Symbol('teaserHeading')
