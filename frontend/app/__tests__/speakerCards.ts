import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SpeakerCard from '../components/Paragraph/SpeakerCard/index.vue'
import SpeakerList from '../components/Paragraph/SpeakerList/index.vue'
import {
  SPEAKER_CARD_HEADING,
  SPEAKER_LIST_VARIANT,
} from '../composables/speakerListVariant'
import { sizesProblems } from './support/sizes'

// The easy-texts build transform strips the default text from $texts()
// calls, so the mock answers with the key the component asked for.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const { list } = vi.hoisted(() => ({
  list: { variant: 'featured' },
}))

mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(0),
  parentType: ref('speaker_list'),
  options: ref({ variant: list.variant, spacing: 'none' }),
}))

const image = {
  image: {
    alt: 'Portrait of the speaker',
    wide: {
      urlPath: '/sites/default/files/styles/wide/public/speaker.jpg',
      width: 1090,
      height: 727,
    },
  },
}

const filled = {
  name: 'Speaker name',
  sessionTitle: 'Session title',
  summary: 'Session summary.',
  link: { uri: { path: 'https://schedule.example/session/1' } },
  image,
}

function mountCard(
  props: Record<string, unknown>,
  variant = 'featured',
  heading?: 'h2' | 'h3',
) {
  return mountSuspended(SpeakerCard, {
    props,
    global: {
      provide: {
        [SPEAKER_LIST_VARIANT as symbol]: computed(() => variant),
        ...(heading
          ? { [SPEAKER_CARD_HEADING as symbol]: computed(() => heading) }
          : {}),
      },
    },
  })
}

// Renders each item of the list's field as a card, as blökkli does.
const FieldStub = defineComponent({
  props: { list: { type: Array, default: () => [] } },
  setup(props) {
    return () =>
      h(
        'div',
        props.list.map((item) =>
          h(SpeakerCard, (item as { props: Record<string, unknown> }).props),
        ),
      )
  },
})

async function mountList(title: string | undefined, variant: string) {
  list.variant = variant
  return mountSuspended(SpeakerList, {
    props: { title, paragraphs: [{ props: filled }] as never },
    global: { stubs: { BlokkliField: FieldStub } },
  })
}

describe('speaker card', () => {
  beforeEach(() => {
    list.variant = 'featured'
  })

  it('shows a featured speaker as a bordered card without the keynote label', async () => {
    const wrapper = await mountCard(filled)

    expect(wrapper.get('article').classes()).toContain('gradient-border')
    expect(wrapper.find('.label').exists()).toBe(false)
    expect(wrapper.get('h3').text()).toBe('Speaker name')
  })

  it('shows a keynote speaker on navy, one column wide, with the keynote label', async () => {
    const wrapper = await mountCard(filled, 'keynote')
    const article = wrapper.get('article')

    expect(article.classes()).toContain('speaker-card-keynote')
    expect(article.classes().filter((c) => c.includes('col-span'))).toEqual([])
    expect(article.classes()).not.toContain('gradient-border')
    expect(wrapper.get('.label').text()).toBe('speakerCard.keynote')
  })

  it.each(['keynote', 'featured'])(
    'shows the %s photo whole, with its own width and height',
    async (variant) => {
      const wrapper = await mountCard(filled, variant)
      const img = wrapper.get('img')

      expect(img.attributes('style') ?? '').not.toContain('aspect-ratio')
      expect(img.attributes('style') ?? '').not.toContain('object-fit')
      expect(img.classes().filter((c) => c.startsWith('object-'))).toEqual([])
      expect(img.attributes('width')).toBe('1090')
      expect(img.attributes('height')).toBe('727')
    },
  )

  it('makes the session title the one link, and says when it leaves the site', async () => {
    const wrapper = await mountCard(filled)
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(1)
    expect(links[0]!.attributes('href')).toBe(
      'https://schedule.example/session/1',
    )
    expect(links[0]!.text()).toBe('Session title (speakerCard.external)')
    expect(links[0]!.find('.sr-only').exists()).toBe(true)
  })

  it('says nothing extra for a link within the site', async () => {
    const wrapper = await mountCard({
      ...filled,
      link: { uri: { path: '/program' } },
    })

    expect(wrapper.get('a').text()).toBe('Session title')
  })

  it('renders no link without a session link or without a session title', async () => {
    const noLink = await mountCard({ ...filled, link: undefined })
    const noTitle = await mountCard({ ...filled, sessionTitle: '  ' })

    expect(noLink.find('a').exists()).toBe(false)
    expect(noLink.text()).toContain('Session title')
    expect(noTitle.find('a').exists()).toBe(false)
  })

  it('renders nothing for empty fields', async () => {
    const wrapper = await mountCard({
      name: ' ',
      sessionTitle: '',
      summary: '',
    })

    expect(wrapper.find('h3').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.findAll('p')).toHaveLength(0)
  })

  it.each([
    ['h2', 'featured'],
    ['h3', 'featured'],
    ['h2', 'keynote'],
    ['h3', 'keynote'],
  ] as const)(
    'sets the name as %s in the same weight in a %s card',
    async (heading, variant) => {
      const wrapper = await mountCard(filled, variant, heading)
      const name = wrapper.get(heading)

      expect(name.text()).toBe('Speaker name')
      expect(name.classes()).toEqual(
        expect.arrayContaining(['font-heading', 'font-medium']),
      )
    },
  )

  it('is an h3 when no list says otherwise', async () => {
    const wrapper = await mountCard(filled)

    expect(wrapper.find('h3').exists()).toBe(true)
  })

  // Ice keeps at least 4.69:1 over the whole navy to blue fill; sky would
  // drop below 4.5:1 towards the blue end.
  it('sets the keynote label in the on-dark colour, not sky', async () => {
    const wrapper = await mountCard(filled, 'keynote')

    expect(wrapper.get('article').classes()).toContain('on-dark')
    expect(wrapper.get('.label').classes()).not.toContain('!text-primary-300')
  })

  it('takes the photo’s alternative text from the media', async () => {
    const wrapper = await mountCard(filled)

    expect(wrapper.get('img').attributes('alt')).toBe('Portrait of the speaker')
  })

  it.each(['featured', 'keynote'])(
    'gives the %s photo a sizes value browsers can read',
    async (variant) => {
      const wrapper = await mountCard(filled, variant)

      expect(sizesProblems(wrapper.get('img').attributes('sizes')!)).toEqual([])
    },
  )
})

describe('speaker list', () => {
  it.each(['featured', 'keynote'])(
    'titles the %s block with an h2 above h3 speaker names',
    async (variant) => {
      const wrapper = await mountList('Keynote speakers', variant)
      const section = wrapper.get('section')

      expect(section.get('h2').text()).toBe('Keynote speakers')
      expect(section.attributes('aria-labelledby')).toBe(
        section.get('h2').attributes('id'),
      )
      expect(section.get('h3').text()).toBe('Speaker name')
    },
  )

  it.each(['keynote', 'featured'])(
    'puts %s cards three to a row from lg, top-aligned',
    async (variant) => {
      const wrapper = await mountList('Speakers', variant)
      const grid = wrapper.get('section > div')

      expect(grid.classes()).toEqual(
        expect.arrayContaining([
          'grid',
          'items-start',
          'sm:grid-cols-2',
          'lg:grid-cols-3',
        ]),
      )
      // A full-height card would stretch to the tallest one in its row.
      expect(grid.get('article').classes()).not.toContain('h-full')
    },
  )

  it('tells its cards which variant it is', async () => {
    const keynote = await mountList('Keynote speakers', 'keynote')
    const featured = await mountList('Featured speakers', 'featured')

    expect(keynote.get('article').classes()).toContain('speaker-card-keynote')
    expect(featured.get('article').classes()).toContain('gradient-border')
  })

  it.each(['featured', 'keynote'])(
    'makes the %s speaker names the h2 when the block has no title',
    async (variant) => {
      const wrapper = await mountList('  ', variant)
      const section = wrapper.get('section')

      expect(section.findAll('h2').map((h) => h.text())).toEqual([
        'Speaker name',
      ])
      expect(section.find('h3').exists()).toBe(false)
      expect(section.attributes('aria-labelledby')).toBeUndefined()
    },
  )
})
