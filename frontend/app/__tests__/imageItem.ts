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
})
