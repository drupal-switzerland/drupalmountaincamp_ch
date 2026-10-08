/**
 * Whether the current page renders its own hero band, which then shows the
 * breadcrumb instead of the layout.
 *
 * Every page sets it next to its breadcrumb links, before
 * `renderPageDependencies()`. Both then change together once the new page's
 * data has loaded, so client navigation never shows the layout breadcrumb
 * above a page that has its own (enforced in pages/__tests__).
 */
export function usePageHasHero() {
  return useState<boolean>('pageHasHero', () => false)
}

export function setPageHasHero(value: boolean) {
  usePageHasHero().value = value
}
