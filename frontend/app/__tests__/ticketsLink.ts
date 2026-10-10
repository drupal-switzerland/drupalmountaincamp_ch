import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useTicketsLink } from '../composables/useTicketsLink'
import { TICKETS_PATH } from '../helpers/navigation'

type MenuLink = { link: { label: string; url?: { path?: string } | null } }

const { mainMenuLinks } = vi.hoisted(() => ({
  mainMenuLinks: { value: [] as MenuLink[] },
}))
mockNuxtImport(
  'useInitData',
  () => () =>
    Promise.resolve(computed(() => ({ mainMenuLinks: mainMenuLinks.value }))),
)

const menuLink = (label: string, path?: string): MenuLink => ({
  link: { label, url: path === undefined ? null : { path } },
})

describe('useTicketsLink', () => {
  it('returns the main menu link that points to the tickets page', async () => {
    const tickets = menuLink('Tickets', TICKETS_PATH)
    mainMenuLinks.value = [
      menuLink('Programme', '/programme'),
      menuLink('No URL'),
      tickets,
      menuLink('Tickets again', TICKETS_PATH),
    ]

    const link = await useTicketsLink()

    expect(link.value).toBe(tickets)
  })

  it('ignores paths that only contain the tickets path', async () => {
    mainMenuLinks.value = [
      menuLink('Ticket info', `${TICKETS_PATH}/info`),
      menuLink('External', `https://example.com${TICKETS_PATH}`),
    ]

    const link = await useTicketsLink()

    expect(link.value).toBeUndefined()
  })

  it('is undefined when the menu has no links', async () => {
    mainMenuLinks.value = []

    const link = await useTicketsLink()

    expect(link.value).toBeUndefined()
  })
})
