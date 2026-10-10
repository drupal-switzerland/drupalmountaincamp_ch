import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import GlobalMenuLinkGroup from '../components/PageHeader/GlobalMenuLinkGroup.vue'
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

mockNuxtImport('useViewport', () => () => ({
  isLessThanMd: computed(() => viewport.isLessThanMd),
}))

async function mountGroup() {
  return mountSuspended(GlobalMenuLinkGroup, {
    props: { linkIndex: 0 },
    attachTo: document.body,
  })
}

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
