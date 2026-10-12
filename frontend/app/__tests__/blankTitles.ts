import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import IconTextItem from '../components/Paragraph/IconTextItem/index.vue'
import IconTextList from '../components/Paragraph/IconTextList/index.vue'
import SponsorList from '../components/Paragraph/SponsorList/index.vue'
import {
  ICON_TEXT_LIST_DISPLAY,
  type IconTextListDisplay,
} from '../composables/iconTextListDisplay'
import { hasText } from '../helpers/text'

const { list } = vi.hoisted(() => ({
  list: { display: 'list' as string },
}))

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(0),
  parentType: ref(undefined),
  options: ref({ display: list.display, spacing: 'none' }),
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

mockNuxtImport('useAllSponsors', () => async () => ({ sponsors: ref([]) }))

const BLANK = '  \n'
const DISPLAYS: IconTextListDisplay[] = [
  'list',
  'dayCards',
  'infoCards',
  'timeline',
]

const headings = (wrapper: { findAll: (selector: string) => unknown[] }) =>
  wrapper.findAll('h2, h3').length

describe('hasText', () => {
  it('is false for nothing and for only spaces', () => {
    expect(hasText(undefined)).toBe(false)
    expect(hasText(null)).toBe(false)
    expect(hasText('')).toBe(false)
    expect(hasText(BLANK)).toBe(false)
  })

  it('is true for text, also with spaces around it', () => {
    expect(hasText(' Venue ')).toBe(true)
  })
})

describe('icon text item', () => {
  async function mountItem(display: IconTextListDisplay, title: string) {
    return mountSuspended(IconTextItem, {
      props: { icon: undefined, title, text: '<p>Text</p>' },
      global: {
        provide: {
          [ICON_TEXT_LIST_DISPLAY as symbol]: computed(() => display),
        },
      },
    })
  }

  it.each(DISPLAYS)(
    'has a heading only for a title with text, as %s',
    async (display) => {
      expect(headings(await mountItem(display, 'Venue'))).toBe(1)
      expect(headings(await mountItem(display, BLANK))).toBe(0)
    },
  )
})

describe('icon text list', () => {
  async function mountList(display: string, title: string) {
    list.display = display
    return mountSuspended(IconTextList, {
      props: { title, text: '<p>Text</p>', paragraphs: [] } as never,
      global: { stubs: { BlokkliField: true } },
    })
  }

  beforeEach(() => {
    list.display = 'list'
  })

  it.each(['list', 'timeline'])(
    'has a heading only for a title with text, as %s',
    async (display) => {
      expect(headings(await mountList(display, 'Programme'))).toBe(1)
      expect(headings(await mountList(display, BLANK))).toBe(0)
    },
  )

  it('names the timeline section by its heading only when there is one', async () => {
    const named = (await mountList('timeline', 'Programme')).get('section')
    const unnamed = (await mountList('timeline', BLANK)).get('section')

    expect(named.attributes('aria-labelledby')).toBe(
      named.get('h2').attributes('id'),
    )
    expect(unnamed.attributes('aria-labelledby')).toBeUndefined()
  })
})

describe('sponsor list', () => {
  it('has a heading only for a title with text', async () => {
    const withTitle = await mountSuspended(SponsorList, {
      props: { title: 'Sponsors' },
    })
    const blank = await mountSuspended(SponsorList, { props: { title: BLANK } })

    expect(headings(withTitle)).toBe(1)
    expect(headings(blank)).toBe(0)
  })
})
