import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ImageItem from '../components/ImageItem/index.vue'

// A derivative as Drupal returned it on production when the cache was filled
// by a request on the internal Lagoon hostname.
const INTERNAL = 'https://frontend.prod.drupalmountaincamp-ch.ch4.amazee.io'
const style = (name: string, width: number) => ({
  urlPath: `${INTERNAL}/sites/default/files/styles/${name}/public/field/image/photo.png.webp?itok=${name}`,
  width,
  height: Math.round(width / 2),
})

describe('ImageItem', () => {
  it('renders Drupal derivatives without the host Drupal built them for', async () => {
    const wrapper = await mountSuspended(ImageItem, {
      props: {
        large: style('large', 480),
        wide: style('wide', 1090),
        extraWide: style('extra_wide', 1376),
        alt: 'Photo',
      },
    })
    const img = wrapper.get('img')
    const urls = [
      img.attributes('src'),
      ...img
        .attributes('srcset')!
        .split(', ')
        .map((entry) => entry.split(' ')[0]),
    ]

    expect(img.attributes('src')).toBe(
      '/sites/default/files/styles/wide/public/field/image/photo.png.webp?itok=wide',
    )
    expect(urls).toHaveLength(4)
    urls.forEach((url) => expect(url).toMatch(/^\/sites\/default\/files\//))
  })

  it('offers every derivative once, narrowest first', async () => {
    const wrapper = await mountSuspended(ImageItem, {
      props: {
        large: style('large', 480),
        mediumWide: style('medium_wide', 768),
        wide: style('wide', 1090),
        extraWide: style('extra_wide', 2070),
      },
    })
    const widths = wrapper
      .get('img')
      .attributes('srcset')!
      .split(', ')
      .map((entry) => entry.split(' ')[1])

    expect(widths).toEqual(['480w', '768w', '1090w', '2070w'])
  })

  it('leaves out a derivative no wider than the one before it', async () => {
    // Styles do not upscale: a 600 px source gives 600 px for every wider style.
    const wrapper = await mountSuspended(ImageItem, {
      props: {
        large: style('large', 480),
        mediumWide: style('medium_wide', 600),
        wide: style('wide', 600),
        extraWide: style('extra_wide', 600),
      },
    })

    expect(wrapper.get('img').attributes('srcset')).toMatch(
      /large\S* 480w, \S*medium_wide\S* 600w$/,
    )
  })
})
