import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import GlobalMenuLinkGroup from '../components/PageHeader/GlobalMenuLinkGroup.vue'
import PageHeader from '../components/PageHeader/index.vue'
import DrupalMessages from '../components/DrupalMessages/index.vue'

const { viewport } = vi.hoisted(() => ({ viewport: { isLessThanMd: false } }))

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

describe('phone menu', () => {
  async function mountHeader() {
    return mountSuspended(PageHeader, {
      attachTo: document.body,
      global: { stubs: { PageHeaderGlobalMenu: true } },
    })
  }

  beforeEach(() => {
    useMainMenuOpen().value = false
    usePhoneSubmenuOpen().value = null
  })

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
  beforeEach(() => {
    viewport.isLessThanMd = false
  })

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
})
