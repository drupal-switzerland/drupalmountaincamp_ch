import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Pagination from '../components/Pagination/index.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (_key: string, fallback: string) => fallback,
}))

async function mountPagination(currentPage: number) {
  return mountSuspended(Pagination, {
    props: { currentPage, totalPages: 3 },
    route: '/news',
  })
}

describe('Pagination', () => {
  it('marks only the current page with aria-current', async () => {
    const wrapper = await mountPagination(2)
    const current = wrapper.findAll('a[aria-current]')

    expect(current).toHaveLength(1)
    expect(current[0]!.attributes('aria-current')).toBe('page')
    expect(current[0]!.text()).toContain('2')
  })

  it('links previous and next with rel', async () => {
    const wrapper = await mountPagination(2)

    expect(wrapper.get('a[rel="prev"]').attributes('href')).toBe('/news')
    expect(wrapper.get('a[rel="next"]').attributes('href')).toBe('/news?page=3')
  })

  it('emits navigate only for a plain click on another page', async () => {
    const wrapper = await mountPagination(2)
    const current = wrapper.get('a[aria-current="page"]')
    const next = wrapper.get('a[rel="next"]')

    await current.trigger('click', { button: 0 })
    await next.trigger('click', { button: 0, ctrlKey: true })
    expect(wrapper.emitted('navigate')).toBeUndefined()

    await next.trigger('click', { button: 0 })
    expect(wrapper.emitted('navigate')).toHaveLength(1)
  })
})
