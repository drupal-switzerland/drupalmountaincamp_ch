/**
 * Whether the current page renders its own hero band, which then shows the
 * breadcrumb instead of the layout.
 *
 * Every page sets it next to its breadcrumb links, before
 * `renderPageDependencies()` (enforced in pages/__tests__). The layout reads
 * it through useDisplayedPageHasHero(), so it only changes on screen together
 * with the page.
 */
export function usePageHasHero() {
  return useState<boolean>('pageHasHero', () => false)
}

export function setPageHasHero(value: boolean) {
  usePageHasHero().value = value
}
