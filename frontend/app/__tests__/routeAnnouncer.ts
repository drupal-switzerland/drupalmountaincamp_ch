import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import App from '../app.vue'

// An anonymous visitor: no toolbar, so nothing inside the admin-only block
// renders.
mockNuxtImport('useDrupalUser', () => () => ref({ accessToolbar: false }))

// The real layout and page fetch from Drupal; the announcer sits beside them.
const Empty = defineComponent({ render: () => h('div') })

describe('route announcer', () => {
  it('is on every page for every visitor', async () => {
    const wrapper = await mountSuspended(App, {
      global: {
        stubs: {
          NuxtLayout: Empty,
          NuxtPage: Empty,
          NuxtLoadingIndicator: Empty,
        },
      },
    })
    const region = wrapper.get('.nuxt-route-announcer [aria-live="polite"]')

    expect(region.attributes('role')).toBe('status')
  })
})
