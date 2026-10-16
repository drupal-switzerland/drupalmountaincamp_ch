import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import GlobalMenuLinkGroup from '../components/PageHeader/GlobalMenuLinkGroup.vue'
import PageHeader from '../components/PageHeader/index.vue'
import DrupalMessages from '../components/DrupalMessages/index.vue'

// Reactive, so a test can cross the breakpoint while a component is mounted.
const { viewport } = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return { viewport: reactive({ isLessThanMd: false }) }
})

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport(
  'useInitData',
  () => async () =>
    ref({
      mainMenuLinks: [
        {
          link: { label: 'News', url: { path: '/news' } },
          subtree: [{ link: { label: 'Article', url: { path: '/news/a' } } }],
        },
      ],
    }),
)

mockNuxtImport('useTicketsLink', () => async () => ref(null))

mockNuxtImport('useViewport', () => () => ({
  isLessThanMd: computed(() => viewport.isLessThanMd),
}))

async function mountGroup() {
  return mountSuspended(GlobalMenuLinkGroup, {
    props: { linkIndex: 0 },
    attachTo: document.body,
  })
}

function pressEscapeOnWindow() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
}

// The menu state is shared between components, and so between tests.
beforeEach(() => {
  viewport.isLessThanMd = false
  useMainMenuOpen().value = false
  usePhoneSubmenuOpen().value = null
  useMainMenuToggleFocusRequests().value = 0
  useDrupalMessages().messages.value = []
})

describe('header with its menu', () => {
  async function mountHeaderWithMenu() {
    const wrapper = await mountSuspended(PageHeader, {
      attachTo: document.body,
    })
    return {
      wrapper,
      menuToggle: wrapper.get('button[aria-controls="global-menu"]'),
      submenuToggle: wrapper.get('nav button[aria-controls]'),
    }
  }

  it('closes one level per Escape on phones', async () => {
    viewport.isLessThanMd = true
    const { wrapper, menuToggle, submenuToggle } = await mountHeaderWithMenu()

    await menuToggle.trigger('click')
    await submenuToggle.trigger('click')
    await nextTick()
    ;(document.activeElement as HTMLElement).blur()

    pressEscapeOnWindow()
    await nextTick()
    await nextTick()
    expect(submenuToggle.attributes('aria-expanded')).toBe('false')
    expect(menuToggle.attributes('aria-expanded')).toBe('true')

    pressEscapeOnWindow()
    await nextTick()
    expect(menuToggle.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('closes a submenu left open on desktop when the viewport becomes a phone', async () => {
    const { wrapper, menuToggle, submenuToggle } = await mountHeaderWithMenu()

    await submenuToggle.trigger('click')
    expect(submenuToggle.attributes('aria-expanded')).toBe('true')

    viewport.isLessThanMd = true
    await nextTick()
    expect(submenuToggle.attributes('aria-expanded')).toBe('false')

    // So the menu opened next needs one Escape, and closes with it.
    await menuToggle.trigger('click')
    pressEscapeOnWindow()
    await nextTick()
    expect(menuToggle.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  // On phones the menu is hidden until it is opened, so the button that opens
  // it is the nearest thing that can take focus.
  it('moves focus from a desktop submenu link to the menu button when the viewport becomes a phone', async () => {
    const { wrapper, menuToggle, submenuToggle } = await mountHeaderWithMenu()

    await submenuToggle.trigger('click')
    ;(wrapper.get('a[href="/news/a"]').element as HTMLElement).focus()

    viewport.isLessThanMd = true
    await nextTick()
    await nextTick()
    expect(submenuToggle.attributes('aria-expanded')).toBe('false')
    expect(menuToggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(menuToggle.element)
    wrapper.unmount()
  })

  it('leaves focus alone at that change when it was not in the submenu', async () => {
    const { wrapper, submenuToggle } = await mountHeaderWithMenu()
    const link = wrapper.get('a[href="/news"]')

    link.element.parentElement!.dispatchEvent(new MouseEvent('mouseenter'))
    ;(link.element as HTMLElement).focus()
    await nextTick()
    expect(submenuToggle.attributes('aria-expanded')).toBe('true')

    viewport.isLessThanMd = true
    await nextTick()
    await nextTick()
    expect(submenuToggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(link.element)
    wrapper.unmount()
  })

  it('moves focus from Back to the submenu toggle, not the menu button, when a phone becomes a desktop', async () => {
    viewport.isLessThanMd = true
    const { wrapper, menuToggle, submenuToggle } = await mountHeaderWithMenu()

    await menuToggle.trigger('click')
    await submenuToggle.trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(
      wrapper.get('button[aria-label="menu.back"]').element,
    )

    viewport.isLessThanMd = false
    await nextTick()
    await nextTick()
    expect(submenuToggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(submenuToggle.element)
    wrapper.unmount()
  })
})

describe('phone menu', () => {
  async function mountHeader() {
    return mountSuspended(PageHeader, {
      attachTo: document.body,
      global: { stubs: { PageHeaderGlobalMenu: true } },
    })
  }

  it('closes on Escape wherever focus is, and focuses the toggle', async () => {
    const wrapper = await mountHeader()
    const toggle = wrapper.get('button[aria-controls="global-menu"]')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')

    pressEscapeOnWindow()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('leaves Escape to an open phone submenu', async () => {
    const wrapper = await mountHeader()
    const toggle = wrapper.get('button[aria-controls="global-menu"]')

    await toggle.trigger('click')
    usePhoneSubmenuOpen().value = 0
    pressEscapeOnWindow()
    await nextTick()

    expect(toggle.attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })

  it('draws the toggle focus ring inside the button', async () => {
    const wrapper = await mountHeader()

    expect(
      wrapper.get('button[aria-controls="global-menu"]').classes(),
    ).toContain('[--focus-ring-offset:calc(var(--focus-ring-width)_*_-1)]')
    wrapper.unmount()
  })
})

describe('main menu submenu toggle', () => {
  it('is a named button outside the link that controls the submenu', async () => {
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')

    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('aria-label')).toBe('News menu.submenu')
    expect(toggle.element.closest('a')).toBeNull()
    expect(
      wrapper.find(`#${toggle.attributes('aria-controls')}`).exists(),
    ).toBe(true)
  })

  it('opens, and Escape closes and returns focus to the toggle', async () => {
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')
    const submenu = () => wrapper.get(`#${toggle.attributes('aria-controls')}`)

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(submenu().attributes('inert')).toBeDefined()

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(submenu().attributes('inert')).toBeUndefined()

    await submenu().get('a').trigger('keydown', { key: 'Escape' })
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('opened by hover, closes on Escape without taking focus', async () => {
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')
    const row = wrapper.get('a[href="/news"]').element.parentElement!

    row.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')

    pressEscapeOnWindow()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(document.body)
    wrapper.unmount()
  })

  it('opened by hover, Escape on the parent link closes it and keeps focus there', async () => {
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')
    const link = wrapper.get('a[href="/news"]')

    link.element.parentElement!.dispatchEvent(new MouseEvent('mouseenter'))
    ;(link.element as HTMLElement).focus()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await link.trigger('keydown', { key: 'Escape' })
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(link.element)
    wrapper.unmount()
  })

  it('closes on Escape after focus left the open phone submenu', async () => {
    viewport.isLessThanMd = true
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')

    await toggle.trigger('click')
    await nextTick()
    ;(document.activeElement as HTMLElement).blur()

    pressEscapeOnWindow()
    await nextTick()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('moves focus to a named Back button on phones', async () => {
    viewport.isLessThanMd = true
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')

    await toggle.trigger('click')
    await nextTick()
    const back = wrapper.get('button[aria-label="menu.back"]')
    expect(document.activeElement).toBe(back.element)

    await back.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('makes the row it covers on phones inert until it closes', async () => {
    viewport.isLessThanMd = true
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')
    const row = () => wrapper.get('a[href="/news"]').element.parentElement!

    await toggle.trigger('click')
    expect(row().hasAttribute('inert')).toBe(true)
    expect(usePhoneSubmenuOpen().value).toBe(0)

    await wrapper.get('button[aria-label="menu.back"]').trigger('click')
    await nextTick()
    expect(row().hasAttribute('inert')).toBe(false)
    expect(usePhoneSubmenuOpen().value).toBeNull()
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('leaves the row reachable when the submenu opens on desktop', async () => {
    const wrapper = await mountGroup()
    await wrapper.get('button[aria-controls]').trigger('click')

    expect(
      wrapper
        .get('a[href="/news"]')
        .element.parentElement!.hasAttribute('inert'),
    ).toBe(false)
    expect(usePhoneSubmenuOpen().value).toBeNull()
    wrapper.unmount()
  })
})

// Crossing the breakpoint closes an open submenu, and a closed one is inert.
describe('main menu submenu at a breakpoint change', () => {
  it('closes a phone submenu on desktop and moves focus from Back to the toggle', async () => {
    viewport.isLessThanMd = true
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')

    await toggle.trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(
      wrapper.get('button[aria-label="menu.back"]').element,
    )

    viewport.isLessThanMd = false
    await nextTick()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(usePhoneSubmenuOpen().value).toBeNull()
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  // On phones the whole menu is hidden until it is opened, so this group's
  // toggle cannot take focus there. The group asks the header instead (see
  // 'header with its menu' for where focus lands).
  it('closes a desktop submenu on phones and asks for focus on the menu button', async () => {
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')

    await toggle.trigger('click')
    ;(wrapper.get('a[href="/news/a"]').element as HTMLElement).focus()

    viewport.isLessThanMd = true
    await nextTick()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(useMainMenuToggleFocusRequests().value).toBe(1)
    expect(document.activeElement).not.toBe(toggle.element)
    wrapper.unmount()
  })
})

describe('main menu submenu panel', () => {
  it('stays open when a tap on the panel blurs focus to nothing', async () => {
    viewport.isLessThanMd = true
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')
    await toggle.trigger('click')

    await wrapper
      .get('button[aria-label="menu.back"]')
      .trigger('focusout', { relatedTarget: null })
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await wrapper
      .get('button[aria-label="menu.back"]')
      .trigger('focusout', { relatedTarget: document.body })
    expect(toggle.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('takes taps across the open phone panel', async () => {
    viewport.isLessThanMd = true
    const wrapper = await mountGroup()
    const toggle = wrapper.get('button[aria-controls]')
    const panel = () => wrapper.get(`#${toggle.attributes('aria-controls')}`)
    expect(panel().classes()).toContain('pointer-events-none')

    await toggle.trigger('click')
    expect(panel().classes()).toContain('pointer-events-auto')
    expect(panel().classes()).not.toContain('pointer-events-none')
    wrapper.unmount()
  })
})

describe('Drupal messages', () => {
  it('adds a message to a live region that is already there', async () => {
    useDrupalMessages().messages.value = []
    const wrapper = await mountSuspended(DrupalMessages)
    const region = wrapper.get('[aria-live="polite"]')
    expect(region.element.childElementCount).toBe(0)

    useDrupalMessages().messages.value = [{ type: 'status', message: 'Saved' }]
    await nextTick()

    expect(wrapper.get('[aria-live="polite"]').element).toBe(region.element)
    expect(region.text()).toContain('Saved')
  })

  it('dismisses one message with a named button', async () => {
    useDrupalMessages().messages.value = [
      { type: 'status', message: 'First' },
      { type: 'error', message: 'Second' },
    ]
    const wrapper = await mountSuspended(DrupalMessages)
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.attributes('aria-label')).toBe('messages.dismiss')

    await buttons[0]!.trigger('click')
    expect(useDrupalMessages().messages.value).toEqual([
      { type: 'error', message: 'Second' },
    ])
  })

  // A live region reads text that changes. Reusing the first message's
  // element for the second would read the second one out again.
  it('keeps the element of a message when the one before it is dismissed', async () => {
    useDrupalMessages().messages.value = [
      { type: 'status', message: 'First' },
      { type: 'error', message: 'Second' },
    ]
    const wrapper = await mountSuspended(DrupalMessages)
    const second = wrapper.get('[aria-live="polite"]').element.children[1]

    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.get('[aria-live="polite"]').element.children[0]).toBe(second)
  })

  it('says the type of an error or a warning in words, not only by colour', async () => {
    useDrupalMessages().messages.value = [
      { type: 'error', message: 'Not saved' },
      { type: 'warning', message: 'Check the date' },
      { type: 'status', message: 'Saved' },
    ]
    const wrapper = await mountSuspended(DrupalMessages)
    const rows = wrapper.get('[aria-live="polite"]').element.children
    const prefix = (row: Element) =>
      row.querySelector('.sr-only')?.textContent?.trim()

    expect(prefix(rows[0]!)).toBe('messages.error:')
    expect(prefix(rows[1]!)).toBe('messages.warning:')
    expect(prefix(rows[2]!)).toBeUndefined()
  })

  it('moves focus to the next message, then to main, when a focused Dismiss button goes away', async () => {
    const main = document.createElement('main')
    main.id = 'main-content'
    main.tabIndex = -1
    document.body.append(main)
    useDrupalMessages().messages.value = [
      { type: 'status', message: 'First' },
      { type: 'error', message: 'Second' },
    ]
    const wrapper = await mountSuspended(DrupalMessages, {
      attachTo: document.body,
    })

    const first = wrapper.findAll('button')[0]!
    ;(first.element as HTMLElement).focus()
    await first.trigger('click')
    await nextTick()
    const remaining = wrapper.findAll('button')
    expect(remaining).toHaveLength(1)
    expect(document.activeElement).toBe(remaining[0]!.element)

    await remaining[0]!.trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(main)
    wrapper.unmount()
    main.remove()
  })

  it('leaves focus alone when a message is dismissed without focus on its button', async () => {
    useDrupalMessages().messages.value = [{ type: 'status', message: 'Saved' }]
    const wrapper = await mountSuspended(DrupalMessages, {
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(document.activeElement).toBe(document.body)
    wrapper.unmount()
  })
})
