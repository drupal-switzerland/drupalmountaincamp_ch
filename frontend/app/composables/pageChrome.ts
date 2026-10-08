import type { BreadcrumbFragment } from '#graphql-operations'

/**
 * Breadcrumb links and hero flag of the page currently on screen.
 *
 * During client navigation the next page sets its breadcrumb links and hero
 * flag while the previous page is still visible. The layout and the page hero
 * read these copies instead, which follow once the next page has rendered
 * (`page:finish`, see plugins/pageChrome.client.ts). Before the first commit
 * (server rendering, hydration) they fall back to the values the page set.
 */
function useCommitted() {
  return {
    breadcrumbLinks: useState<BreadcrumbFragment[] | null>(
      'committedBreadcrumbLinks',
      () => null,
    ),
    pageHasHero: useState<boolean | null>('committedPageHasHero', () => null),
  }
}

export function useDisplayedBreadcrumbLinks() {
  const links = useBreadcrumbLinks()
  const committed = useCommitted().breadcrumbLinks
  return computed(() => committed.value ?? links.value)
}

export function useDisplayedPageHasHero() {
  const hasHero = usePageHasHero()
  const committed = useCommitted().pageHasHero
  return computed(() => committed.value ?? hasHero.value)
}

/** Returns a function that copies the page's values to the displayed ones. */
export function usePageChromeCommit() {
  const committed = useCommitted()
  const links = useBreadcrumbLinks()
  const hasHero = usePageHasHero()
  return () => {
    committed.breadcrumbLinks.value = links.value
    committed.pageHasHero.value = hasHero.value
  }
}
