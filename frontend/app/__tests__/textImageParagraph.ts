import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import TextImage from '../components/Paragraph/TextImage/index.vue'
import { IS_FRONT_PAGE } from '../composables/frontPage'

const { paragraph } = vi.hoisted(() => ({ paragraph: { index: 0 } }))

// A top-level paragraph, at the position set per test.
mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(paragraph.index),
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

async function imageLoading(isFrontPage?: boolean) {
  const wrapper = await mountSuspended(TextImage, {
    props: { title: 'Community', text: '<p>Text</p>', image },
    global:
      isFrontPage === undefined
        ? {}
        : { provide: { [IS_FRONT_PAGE as symbol]: isFrontPage } },
  })
  return wrapper.get('img').attributes('loading')
}

describe('text image paragraph', () => {
  beforeEach(() => {
    paragraph.index = 0
  })

  it('loads the first paragraph image eagerly on an inner page, where it is in the first viewport', async () => {
    expect(await imageLoading()).toBe('eager')
    expect(await imageLoading(false)).toBe('eager')
  })

  it('loads it lazily on the homepage, where the hero pushes it below the fold', async () => {
    expect(await imageLoading(true)).toBe('lazy')
  })

  it('loads the image of a later paragraph lazily on any page', async () => {
    paragraph.index = 2

    expect(await imageLoading()).toBe('lazy')
    expect(await imageLoading(true)).toBe('lazy')
  })
})
