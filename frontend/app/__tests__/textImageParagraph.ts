import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import TextImage from '../components/Paragraph/TextImage/index.vue'

// The first paragraph of a page, not nested in another one.
mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(0),
  parentType: ref(undefined),
  options: ref({ imagePosition: 'right', spacing: 'none' }),
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

const image = {
  image: {
    alt: 'Attendees',
    wide: {
      urlPath: '/sites/default/files/styles/wide/public/photo.jpg',
      width: 1090,
      height: 727,
    },
  },
}

describe('text image paragraph', () => {
  it('loads its image lazily even as the first paragraph: the hero is above it', async () => {
    const wrapper = await mountSuspended(TextImage, {
      props: { title: 'Community', text: '<p>Text</p>', image },
    })

    expect(wrapper.get('img').attributes('loading')).toBe('lazy')
  })
})
