import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import IconTextItem from '../components/Paragraph/IconTextItem/index.vue'
import Quote from '../components/Paragraph/Quote/index.vue'
import { ICON_TEXT_LIST_DISPLAY } from '../composables/iconTextListDisplay'
import { IMAGE_CREDIT_BELOW_IMAGE } from '../composables/imageCreditDisplay'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(0),
  parentType: ref(undefined),
  options: ref({ alignment: 'left' }),
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

const copyright = 'Josef Kruckenberg'

const image = {
  copyright,
  image: {
    alt: 'Photo',
    wide: {
      urlPath: '/sites/default/files/styles/wide/public/photo.jpg',
      width: 1090,
      height: 727,
    },
  },
}

function mountInfoCard(isArticle: boolean) {
  return mountSuspended(IconTextItem, {
    props: { icon: undefined, image, title: 'Venue', text: '<p>Text</p>' },
    global: {
      provide: {
        [ICON_TEXT_LIST_DISPLAY as symbol]: computed(() => 'infoCards'),
        [IMAGE_CREDIT_BELOW_IMAGE as symbol]: isArticle,
      },
    },
  })
}

function mountQuote(isArticle: boolean) {
  return mountSuspended(Quote, {
    props: { quote: 'Great camp', name: 'Ada', company: 'Example', image },
    global: { provide: { [IMAGE_CREDIT_BELOW_IMAGE as symbol]: isArticle } },
  })
}

describe.each([
  ['info card', mountInfoCard],
  ['quote', mountQuote],
])('image credit in the %s', (_name, mountParagraph) => {
  it('sits on the image once, with nothing under it, outside articles', async () => {
    const wrapper = await mountParagraph(false)
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(1)
    expect(
      wrapper.get(`[id="${buttons[0]!.attributes('aria-controls')}"]`).text(),
    ).toBe(copyright)
    expect(wrapper.text()).not.toContain(`© ${copyright}`)
  })

  it('stays under the image in articles', async () => {
    const wrapper = await mountParagraph(true)

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain(`© ${copyright}`)
  })
})
