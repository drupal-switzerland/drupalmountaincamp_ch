import { describe, expect, it } from 'vitest'
import { defineComponent, h, inject, type Component } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Landing from '../components/Node/Page/Landing/index.vue'
import PressRelease from '../components/Node/PressRelease/index.vue'
import TextImage from '../components/Paragraph/TextImage/index.vue'
import { FIRST_PARAGRAPH_IN_FIRST_VIEWPORT } from '../composables/firstViewport'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

// The text image stands as the node's first top-level paragraph.
mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(0),
  parentType: ref(undefined),
  options: ref({ imagePosition: 'right', spacing: 'none' }),
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

const photo = (name: string) => ({
  alt: name,
  wide: {
    urlPath: `/sites/default/files/styles/wide/public/${name}.jpg`,
    width: 1090,
    height: 727,
  },
})

const topImage = { image: photo('top') }

// Stands in for the node's paragraphs and shows what they are told.
const ToldBlocks = defineComponent({
  inheritAttrs: false,
  setup: () => () =>
    h(
      'output',
      String(inject(FIRST_PARAGRAPH_IN_FIRST_VIEWPORT) ?? 'not provided'),
    ),
})

// A text image with a photo as the first paragraph.
const TextImageFirst = defineComponent({
  inheritAttrs: false,
  setup: () => () =>
    h(TextImage, {
      title: 'First',
      text: '<p>Text</p>',
      image: { image: photo('first') },
    }),
})

const Nothing = defineComponent({ inheritAttrs: false, render: () => null })

const Provider = defineComponent({
  inheritAttrs: false,
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.({ entity: undefined }),
})

const blokkliProps = {} as never

function stubs(paragraphs: Component) {
  return {
    BlokkliProvider: Provider,
    BlokkliField: paragraphs,
    HomeHero: Nothing,
    Container: Nothing,
  }
}

function mountLanding(
  paragraphs: Component,
  { isFront = false, hero = false } = {},
) {
  return mountSuspended(Landing, {
    props: {
      uuid: 'uuid',
      title: 'Page',
      isFront,
      hero: hero ? (topImage as never) : undefined,
      blokkliProps,
    },
    global: { stubs: stubs(paragraphs) },
  })
}

function mountArticle(paragraphs: Component, { image = false } = {}) {
  return mountSuspended(PressRelease, {
    props: {
      title: 'Article',
      image: image ? (topImage as never) : undefined,
      blokkliProps,
    },
    global: { stubs: stubs(paragraphs) },
  })
}

function highPriorityImages(wrapper: { findAll: (s: string) => unknown[] }) {
  return wrapper
    .findAll('img[fetchpriority="high"]')
    .map((img) =>
      (img as { attributes: (a: string) => string }).attributes('alt'),
    )
}

describe('first paragraph in the first viewport', () => {
  it.each([
    ['the homepage, below the hero', { isFront: true }, 'false'],
    ['a page with a hero image', { hero: true }, 'false'],
    ['a page without a hero image', {}, 'true'],
  ])('is told to a page’s paragraphs on %s', async (_, options, told) => {
    const wrapper = await mountLanding(ToldBlocks, options)
    expect(wrapper.get('output').text()).toBe(told)
  })

  it.each([
    ['with an image', { image: true }, 'false'],
    ['without an image', {}, 'true'],
  ])('is told to an article’s paragraphs %s', async (_, options, told) => {
    const wrapper = await mountArticle(ToldBlocks, options)
    expect(wrapper.get('output').text()).toBe(told)
  })
})

describe('one image with high priority', () => {
  it.each([
    ['a page with a hero and a text image first', { hero: true }, ['top']],
    ['a page with a text image first', {}, ['first']],
    ['the homepage with a text image first', { isFront: true }, []],
  ])('on %s', async (_, options, expected) => {
    const wrapper = await mountLanding(TextImageFirst, options)
    expect(highPriorityImages(wrapper)).toEqual(expected)
  })

  it.each([
    [
      'an article with an image and a text image first',
      { image: true },
      ['top'],
    ],
    ['an article with a text image first', {}, ['first']],
  ])('on %s', async (_, options, expected) => {
    const wrapper = await mountArticle(TextImageFirst, options)
    expect(highPriorityImages(wrapper)).toEqual(expected)
  })
})
