import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaImage from '../components/MediaImage/index.vue'

const image = {
  alt: 'Photo',
  wide: {
    urlPath: '/sites/default/files/styles/wide/public/photo.jpg',
    width: 1090,
    height: 545,
  },
}

describe('MediaImage', () => {
  it('puts imgClass on the image, so rounding never clips the caption', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        image,
        copyright: 'Josef Kruckenberg',
        imgClass: 'rounded-[18px]',
      },
    })

    expect(wrapper.get('img').classes()).toContain('rounded-[18px]')
    expect(wrapper.get('figure').classes()).not.toContain('rounded-[18px]')
    expect(wrapper.get('figure').classes()).not.toContain('overflow-hidden')
    expect(wrapper.get('figcaption').text()).toBe('© Josef Kruckenberg')
  })

  it('renders no caption without caption or copyright', async () => {
    const wrapper = await mountSuspended(MediaImage, { props: { image } })

    expect(wrapper.find('figcaption').exists()).toBe(false)
  })
})
