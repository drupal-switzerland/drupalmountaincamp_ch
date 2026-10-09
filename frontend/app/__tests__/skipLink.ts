import { describe, expect, it } from 'vitest'
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

describe('skip link', () => {
  it('is the first element in the layout and targets main', async () => {
    const wrapper = await mountLayout()
    const first = wrapper.element.firstElementChild

    expect(first?.tagName).toBe('A')
    expect(first?.getAttribute('href')).toBe('#main-content')
    expect(first?.textContent?.trim()).toBe('layout.skipToContent')
  })

  it('points at a main element that can take focus', async () => {
    const wrapper = await mountLayout()
    const main = wrapper.get('main#main-content')

    expect(main.attributes('tabindex')).toBe('-1')
  })
})
