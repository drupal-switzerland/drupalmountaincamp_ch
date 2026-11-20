import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import TicketsButton from '../components/TicketsButton/index.vue'
import type { TicketsLink } from '../composables/useTicketsLink'
import { TICKET_SHOP_URL, TICKETS_PATH } from '../helpers/navigation'

const { ticketsLink } = vi.hoisted(() => ({
  ticketsLink: { value: undefined as Partial<TicketsLink> | undefined },
}))
mockNuxtImport(
  'useTicketsLink',
  () => async () => computed(() => ticketsLink.value),
)
// The easy-texts build transform strips the default text from $texts()
// calls, so the mock answers with the key the component asked for.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const mountButton = () =>
  mountSuspended(TicketsButton, {
    slots: { default: ({ label }: { label: string }) => label },
  })

describe('TicketsButton', () => {
  it('links to the tickets page', async () => {
    ticketsLink.value = {
      href: TICKETS_PATH,
      label: 'Register',
      target: '_self',
      opensNewTab: false,
    }

    const link = (await mountButton()).get('a')

    expect(link.attributes('href')).toBe(TICKETS_PATH)
    expect(link.attributes('target')).toBe('_self')
    expect(link.text()).toBe('Register')
  })

  it('links to the ticket shop in the same tab', async () => {
    ticketsLink.value = {
      href: TICKET_SHOP_URL,
      label: 'Register',
      target: '_self',
      opensNewTab: false,
    }

    const wrapper = await mountButton()
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe(TICKET_SHOP_URL)
    expect(link.attributes('target')).toBe('_self')
    expect(link.attributes('aria-current')).toBeUndefined()
    expect(link.text()).toBe('Register')
  })

  it('says so in the name when the link opens a new tab', async () => {
    ticketsLink.value = {
      href: TICKET_SHOP_URL,
      label: 'Register',
      target: '_blank',
      opensNewTab: true,
    }

    const link = (await mountButton()).get('a')

    expect(link.attributes('target')).toBe('_blank')
    expect(link.text()).toBe('Register (newTabHint)')
  })

  it('renders nothing without a tickets link', async () => {
    ticketsLink.value = undefined

    const wrapper = await mountButton()

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })
})
