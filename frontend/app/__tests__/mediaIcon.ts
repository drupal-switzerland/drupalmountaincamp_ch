import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaIcon from '../components/MediaIcon/index.vue'

async function mountIcon(alt: string | null) {
  return mountSuspended(MediaIcon, {
    props: {
      id: '5',
      changed: { first: { formatted: '1760000000' } },
      svg: { first: { alt, width: 24, height: 24 } },
    } as never,
  })
}

describe('media icon', () => {
  it('is an image named by its alternative text', async () => {
    const svg = (await mountIcon('Train')).get('svg')

    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Train')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
  })

  it('is hidden from assistive technology without alternative text', async () => {
    const svg = (await mountIcon(null)).get('svg')

    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('aria-label')).toBeUndefined()
    expect(svg.attributes('role')).toBeUndefined()
  })

  it('keeps the icon address, with the alternative text as its slug', async () => {
    const wrapper = await mountIcon('Train')

    expect(wrapper.html()).toContain('/api/icon/5--train.svg?h=1760000000#icon')
  })
})
