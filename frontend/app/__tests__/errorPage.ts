import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { createError } from '#app'
import ErrorPage from '../error.vue'

// The easy-texts build transform strips the default text from $texts()
// calls, so the mock answers with the key the component asked for.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

// The real layout fetches menus from Drupal; the stub only proves the error
// page renders inside it.
const LayoutStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', { 'data-test': 'layout' }, slots.default?.())
  },
})

async function mountError(statusCode: number) {
  return mountSuspended(ErrorPage, {
    props: { error: createError({ statusCode, message: 'internal detail' }) },
    global: { stubs: { NuxtLayout: LayoutStub } },
  })
}

describe('error page', () => {
  it.each([404, 500])('renders a %i inside the site layout', async (code) => {
    const wrapper = await mountError(code)

    expect(wrapper.find('[data-test="layout"] h1').exists()).toBe(true)
    expect(wrapper.get('.label').text()).toBe(`error.code ${code}`)
    expect(wrapper.get('a[href="/"]').text()).toBe('error.home')
  })

  it('names a missing page as not found', async () => {
    const wrapper = await mountError(404)
    expect(wrapper.get('h1').text()).toBe('error.notFoundTitle')
  })

  it('shows fixed copy for server errors, not the error message', async () => {
    const wrapper = await mountError(500)
    expect(wrapper.get('h1').text()).toBe('error.title')
    expect(wrapper.text()).not.toContain('internal detail')
  })
})
