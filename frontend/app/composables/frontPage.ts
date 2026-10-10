import type { InjectionKey } from 'vue'

/** Provided by the page component: whether its blocks are the homepage's. */
export const IS_FRONT_PAGE: InjectionKey<boolean> = Symbol('isFrontPage')
