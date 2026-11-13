import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BrandRidge from '../components/BrandRidge/index.vue'

function svgIds(html: string) {
  return [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]!)
}

describe('Brand ridge', () => {
  it('is hidden from assistive technology', async () => {
    const wrapper = await mountSuspended(BrandRidge)

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('svg')).toHaveLength(2)
  })

  it('shows only the phone crop when cropped', async () => {
    const wrapper = await mountSuspended(BrandRidge, {
      props: { cropped: true },
    })

    expect(wrapper.findAll('svg')).toHaveLength(1)
  })

  it('anchors the crop to the tall peak', async () => {
    const left = await mountSuspended(BrandRidge, { props: { cropped: true } })
    const right = await mountSuspended(BrandRidge, {
      props: { cropped: true, mirrored: true },
    })

    expect(left.get('svg').attributes('preserveAspectRatio')).toBe(
      'xMinYMax slice',
    )
    expect(right.get('svg').attributes('preserveAspectRatio')).toBe(
      'xMaxYMax slice',
    )
    expect(right.find('g[transform]').exists()).toBe(true)
  })

  it('defines each SVG id once', async () => {
    const ids = svgIds((await mountSuspended(BrandRidge)).html())

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('refers only to ids it defines', async () => {
    const html = (await mountSuspended(BrandRidge)).html()
    const ids = svgIds(html)
    const refs = [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!)

    expect(refs.length).toBeGreaterThan(0)
    expect(refs.filter((ref) => !ids.includes(ref))).toEqual([])
  })
})
