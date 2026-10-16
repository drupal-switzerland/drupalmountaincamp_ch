import { afterEach, describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import DefaultLayout from '../layouts/default.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

async function mountLayout() {
  return mountSuspended(DefaultLayout, {
    global: {
      stubs: {
        PageHeaderEventStrip: true,
        PageHeader: true,
        PageFooter: true,
        Breadcrumb: true,
        DrupalMessages: true,
      },
    },
  })
}

// The head is written after a tick, and only then on the document.
async function rootIsLocked() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  return document.documentElement.classList.contains('overflow-hidden')
}

afterEach(() => {
  useMainMenuOpen().value = false
})

describe('page behind the phone menu', () => {
  it('cannot be scrolled while the menu is open, and can again once it closes', async () => {
    const wrapper = await mountLayout()
    expect(await rootIsLocked()).toBe(false)

    useMainMenuOpen().value = true
    expect(await rootIsLocked()).toBe(true)

    useMainMenuOpen().value = false
    expect(await rootIsLocked()).toBe(false)
    wrapper.unmount()
  })
})
