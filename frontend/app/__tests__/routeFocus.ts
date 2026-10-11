import { describe, expect, it } from 'vitest'
import { START_LOCATION } from 'vue-router'
import {
  isNavigationToAnotherPage,
  MAIN_CONTENT_ID,
} from '../helpers/routeFocus'
import DefaultLayout from '../layouts/default.vue?raw'

describe('focus after navigation', () => {
  it('moves for a navigation to another path', () => {
    expect(isNavigationToAnotherPage({ path: '/news' }, { path: '/' })).toBe(
      true,
    )
  })

  it('stays put on the first load', () => {
    expect(isNavigationToAnotherPage({ path: '/news' }, START_LOCATION)).toBe(
      false,
    )
  })

  it('stays put for query and hash changes on the same path', () => {
    expect(
      isNavigationToAnotherPage({ path: '/news' }, { path: '/news' }),
    ).toBe(false)
  })

  it('stays put when the navigation failed', () => {
    expect(
      isNavigationToAnotherPage(
        { path: '/news' },
        { path: '/' },
        new Error('aborted'),
      ),
    ).toBe(false)
  })

  it('targets the main element the layout renders', () => {
    expect(DefaultLayout).toContain(`id="${MAIN_CONTENT_ID}"`)
  })
})
