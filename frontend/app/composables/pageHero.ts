/**
 * Whether the current page renders its own hero band, which then shows the
 * breadcrumb instead of the layout.
 *
 * Set by pages before `renderPageDependencies()`, like the breadcrumb links,
 * so the layout's breadcrumb renders the same on the server and the client.
 */
export function usePageHasHero() {
  return useState<boolean>('pageHasHero', () => false)
}

export function setPageHasHero(value: boolean) {
  usePageHasHero().value = value
}
