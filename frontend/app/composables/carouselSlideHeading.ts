import type { ComputedRef, InjectionKey } from 'vue'

export type CarouselSlideHeading = 'h2' | 'h3'

/** Provided by the carousel paragraph: the heading element of its slides. */
export const CAROUSEL_SLIDE_HEADING: InjectionKey<
  ComputedRef<CarouselSlideHeading>
> = Symbol('carouselSlideHeading')
