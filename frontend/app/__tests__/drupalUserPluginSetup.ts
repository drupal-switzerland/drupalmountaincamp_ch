import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { NuxtApp } from '#app'
import drupalUserPlugin from '../plugins/drupalUser'
import useDrupalUser from '../composables/useDrupalUser'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))

mockNuxtImport('useGraphqlQuery', () => query)

// Vitest runs the browser build, where the plugin queries the user without
// looking for a session cookie.
function runPlugin() {
  return (drupalUserPlugin as unknown as (app: NuxtApp) => Promise<void>)(
    useNuxtApp(),
  )
}

describe('Drupal user plugin: setup', () => {
  beforeEach(() => {
    query.mockReset()
    useDrupalUser().value = { fetched: false, accessToolbar: false }
  })

  it('does not query again once the user was fetched', async () => {
    useDrupalUser().value.fetched = true

    await runPlugin()

    expect(query).not.toHaveBeenCalled()
  })

  it.each([true, false])(
    'takes the toolbar access (%s) from the query',
    async (canAccessToolbar) => {
      useDrupalUser().value.accessToolbar = !canAccessToolbar
      query.mockResolvedValue({
        data: { currentDrupalUser: { canAccessToolbar } },
      })

      await runPlugin()

      expect(query).toHaveBeenCalledWith('drupalUser')
      expect(useDrupalUser().value).toEqual({
        fetched: true,
        accessToolbar: canAccessToolbar,
      })
    },
  )

  it('keeps no toolbar access when Drupal returns no user', async () => {
    query.mockResolvedValue({ data: { currentDrupalUser: null } })

    await runPlugin()

    expect(useDrupalUser().value).toEqual({
      fetched: true,
      accessToolbar: false,
    })
  })
})
