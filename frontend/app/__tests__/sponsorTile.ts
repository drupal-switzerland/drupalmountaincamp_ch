import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SponsorTile from '../components/SponsorTile/index.vue'
import { LOGO_BOXES, logoSize } from '../helpers/sponsors'

function sponsor(width: number, height: number) {
  return {
    uuid: 'a',
    title: 'The DropTimes',
    link: { uri: { path: 'https://www.thedroptimes.com/' } },
    logo: {
      first: {
        entity: {
          image: { wide: { urlPath: '/images/logo.png', width, height } },
        },
      },
    },
  }
}

describe('SponsorTile logo', () => {
  it('carries the width and height it is laid out at', async () => {
    const wrapper = await mountSuspended(SponsorTile, {
      props: { sponsor: sponsor(400, 173), box: LOGO_BOXES.standard },
    })
    const expected = logoSize(400, 173, LOGO_BOXES.standard)
    const img = wrapper.get('img')

    expect(img.attributes('width')).toBe(String(expected.width))
    expect(img.attributes('height')).toBe(String(expected.height))
  })

  it('keeps the box that sizes the logo, so nothing moves', async () => {
    const wrapper = await mountSuspended(SponsorTile, {
      props: { sponsor: sponsor(400, 173), box: LOGO_BOXES.standard },
    })
    const expected = logoSize(400, 173, LOGO_BOXES.standard)
    const box = wrapper.get('span[aria-hidden="true"]')

    expect(box.attributes('style')).toContain(`width: ${expected.width}px`)
    expect(box.attributes('style')).toContain('aspect-ratio: 400 / 173')
    expect(wrapper.get('img').classes()).toContain('size-full')
  })
})
