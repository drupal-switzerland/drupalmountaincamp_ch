import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useTicketsLink } from '../composables/useTicketsLink'
import { TICKET_SHOP_URL, TICKETS_PATH } from '../helpers/navigation'

type MenuLink = {
  link: {
    label: string
    url?: { path?: string } | null
    attribute?: string | null
  }
}

const { mainMenuLinks } = vi.hoisted(() => ({
  mainMenuLinks: { value: [] as MenuLink[] },
}))
mockNuxtImport(
  'useInitData',
  () => () =>
    Promise.resolve(computed(() => ({ mainMenuLinks: mainMenuLinks.value }))),
)

const menuLink = (
  label: string,
  path?: string,
  attribute: string | null = null,
): MenuLink => ({
  link: { label, url: path === undefined ? null : { path }, attribute },
})

describe('useTicketsLink', () => {
  it('returns the first main menu link to the tickets page', async () => {
    const tickets = menuLink('Register', TICKETS_PATH)
    mainMenuLinks.value = [
      menuLink('Programme', '/programme'),
      menuLink('No URL'),
      tickets,
      menuLink('Again', TICKETS_PATH),
    ]

    const link = await useTicketsLink()

    expect(link.value).toEqual({
      item: tickets,
      href: TICKETS_PATH,
      label: 'Register',
      target: '_self',
      opensNewTab: false,
    })
  })

  it('returns the link to the ticket shop in the same tab', async () => {
    const shop = menuLink('Register', TICKET_SHOP_URL)
    mainMenuLinks.value = [menuLink('Programme', '/programme'), shop]

    const link = await useTicketsLink()

    expect(link.value?.item).toBe(shop)
    expect(link.value?.href).toBe(TICKET_SHOP_URL)
    expect(link.value?.target).toBe('_self')
    expect(link.value?.opensNewTab).toBe(false)
  })

  it('matches the ticket shop without the trailing slash', async () => {
    const shop = menuLink('Register', TICKET_SHOP_URL.replace(/\/$/, ''))
    mainMenuLinks.value = [shop]

    const link = await useTicketsLink()

    expect(link.value?.item).toBe(shop)
  })

  it('opens a new tab only when the menu link target asks for it', async () => {
    mainMenuLinks.value = [menuLink('Register', TICKET_SHOP_URL, '_blank')]

    const link = await useTicketsLink()

    expect(link.value?.target).toBe('_blank')
    expect(link.value?.opensNewTab).toBe(true)
  })

  it('ignores other paths and other shops', async () => {
    mainMenuLinks.value = [
      menuLink('Info', `${TICKETS_PATH}/info`),
      menuLink('External', `https://example.com${TICKETS_PATH}`),
      menuLink('Other year', 'https://pretix.eu/mountain-camp/2026/'),
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
