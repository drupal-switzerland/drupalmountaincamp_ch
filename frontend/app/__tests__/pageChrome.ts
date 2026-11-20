import { beforeEach, describe, expect, it } from 'vitest'
import {
  useDisplayedBreadcrumbLinks,
  useDisplayedPageHasHero,
  usePageChromeCommit,
} from '../composables/pageChrome'
import { useBreadcrumbLinks } from '../composables/breadcrumb'
import { usePageHasHero } from '../composables/pageHero'

const home = { title: 'Home', url: { path: '/' } }
const news = { title: 'News', url: { path: '/news' } }

describe('page chrome', () => {
  beforeEach(() => {
    clearNuxtState()
  })

  it('shows the page values before the first commit', () => {
    useBreadcrumbLinks().value = [home]
    usePageHasHero().value = true

    expect(useDisplayedBreadcrumbLinks().value).toEqual([home])
    expect(useDisplayedPageHasHero().value).toBe(true)
  })

  it('keeps the committed values until the next commit', () => {
    const links = useBreadcrumbLinks()
    const hasHero = usePageHasHero()
    const displayedLinks = useDisplayedBreadcrumbLinks()
    const displayedHero = useDisplayedPageHasHero()
    const commit = usePageChromeCommit()

    links.value = [home]
    hasHero.value = true
    commit()

    // The next page sets its values while the previous one is on screen.
    links.value = [home, news]
    hasHero.value = false
    expect(displayedLinks.value).toEqual([home])
    expect(displayedHero.value).toBe(true)

    commit()
    expect(displayedLinks.value).toEqual([home, news])
    expect(displayedHero.value).toBe(false)
  })

  it('keeps committed empty links and no hero', () => {
    const links = useBreadcrumbLinks()
    const hasHero = usePageHasHero()
    const commit = usePageChromeCommit()

    links.value = []
    hasHero.value = false
    commit()
    links.value = [news]
    hasHero.value = true

    expect(useDisplayedBreadcrumbLinks().value).toEqual([])
    expect(useDisplayedPageHasHero().value).toBe(false)
  })
})
