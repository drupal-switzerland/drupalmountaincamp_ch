import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import Carousel from '../components/Paragraph/Carousel/index.vue'
import Slider from '../components/Paragraph/Carousel/Slider.vue'
import { IS_FRONT_PAGE } from '../composables/frontPage'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const { paragraph } = vi.hoisted(() => ({
  paragraph: { index: 0, parentType: undefined as string | undefined },
}))

mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(paragraph.index),
  parentType: ref(paragraph.parentType),
}))

async function headings(title: string | undefined) {
  const wrapper = await mountSuspended(Carousel, {
    props: { title, slides: [] } as never,
    global: { stubs: { BlokkliField: true } },
  })
  return wrapper.findAll('h2').map((heading) => heading.text())
}

// Renders what the carousel puts into the field, as blökkli does in proxy mode.
const FieldStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => h('div', slots.default?.({ items: [] }))
  },
})

async function eagerFirstSlide(isFrontPage: boolean) {
  const wrapper = await mountSuspended(Carousel, {
    props: { title: 'Impressions', slides: [] } as never,
    global: {
      stubs: { BlokkliField: FieldStub },
      provide: { [IS_FRONT_PAGE as symbol]: isFrontPage },
    },
  })
  // The slider is loaded on demand.
  await flushPromises()
  return wrapper.getComponent(Slider).props('eagerFirstSlide')
}

describe('carousel paragraph', () => {
  beforeEach(() => {
    paragraph.index = 0
    paragraph.parentType = undefined
  })

  it('has a heading only when it has a title', async () => {
    expect(await headings('Impressions')).toEqual(['Impressions'])
    expect(await headings('')).toEqual([])
    expect(await headings('  \n')).toEqual([])
    expect(await headings(undefined)).toEqual([])
  })

  it('tells its slider that it is in the first viewport as the first paragraph of an inner page', async () => {
    expect(await eagerFirstSlide(false)).toBe(true)
  })

  it('does not on the homepage, where the hero pushes it below the fold', async () => {
    expect(await eagerFirstSlide(true)).toBe(false)
  })

  it('does not as a later paragraph', async () => {
    paragraph.index = 2

    expect(await eagerFirstSlide(false)).toBe(false)
  })
})
