import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import LatestNews from '../components/Paragraph/BlokkliFragment/LatestNews/index.vue'
import Card from '../components/Node/PressRelease/Card/index.vue'

const CARD_SIZES =
  '(min-width: 1380px) 412px, (min-width: 1024px) 33vw, calc(100vw - 38px)'

// The app itself queries Drupal while it starts (init data, the user), before
// any test has said what Drupal answers.
const { query } = vi.hoisted(() => ({
  query: vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (..._args: any[]): Promise<any> => ({ data: {} }),
  ),
}))

mockNuxtImport('useGraphqlQuery', () => query)
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (_key: string, fallback: string) => fallback,
}))

function article(index: number) {
  return {
    uuid: `uuid-${index}`,
    title: `Article ${index}`,
    url: { path: `/news/article-${index}` },
    image: {
      image: {
        large: {
          urlPath: `/sites/default/files/styles/large/${index}.webp`,
          width: 480,
          height: 270,
        },
        wide: {
          urlPath: `/sites/default/files/styles/wide/${index}.webp`,
          width: 1090,
          height: 613,
        },
      },
    },
  }
}

describe('homepage news cards', () => {
  beforeEach(() => {
    clearNuxtData()
    query.mockReset()
  })

  it('give every card image the width of a card in the grid', async () => {
    query.mockResolvedValue({
      data: { entityQuery: { items: [article(1), article(2), article(3)] } },
    })

    const wrapper = await mountSuspended(LatestNews)
    const sizes = wrapper.findAll('img').map((img) => img.attributes('sizes'))

    expect(sizes).toEqual([CARD_SIZES, CARD_SIZES, CARD_SIZES])
  })
})

describe('news card', () => {
  it('passes the sizes of the grid that holds it to its image', async () => {
    const wrapper = await mountSuspended(Card, {
      props: { ...article(1), imageSizes: '(min-width: 1024px) 50vw, 100vw' },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(min-width: 1024px) 50vw, 100vw',
    )
  })

  it('falls back to the image style when no grid gives it sizes', async () => {
    const wrapper = await mountSuspended(Card, { props: article(1) })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(min-width: 728px) 728px, 100vw',
    )
  })
})
