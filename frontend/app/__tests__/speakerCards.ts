import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SpeakerCard from '../components/Paragraph/SpeakerCard/index.vue'
import SpeakerList from '../components/Paragraph/SpeakerList/index.vue'
import { SPEAKER_LIST_VARIANT } from '../composables/speakerListVariant'
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

function mountCard(props: Record<string, unknown>, variant = 'featured') {
  return mountSuspended(SpeakerCard, {
    props,
    global: {
      provide: { [SPEAKER_LIST_VARIANT as symbol]: computed(() => variant) },
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

  it('shows a keynote speaker on navy, two columns wide, with the keynote label', async () => {
    const wrapper = await mountCard(filled, 'keynote')
    const article = wrapper.get('article')

    expect(article.classes()).toContain('speaker-card-keynote')
    expect(article.classes()).toContain('sm:col-span-2')
    expect(article.classes()).not.toContain('gradient-border')
    expect(wrapper.get('.label').text()).toBe('speakerCard.keynote')
  })

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

  it('tells its cards which variant it is', async () => {
    const keynote = await mountList('Keynote speakers', 'keynote')
    const featured = await mountList('Featured speakers', 'featured')

    expect(keynote.get('article').classes()).toContain('speaker-card-keynote')
    expect(featured.get('article').classes()).toContain('gradient-border')
  })

  it('renders no heading and no label for a blank title', async () => {
    const wrapper = await mountList('  ', 'featured')

    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.get('section').attributes('aria-labelledby')).toBeUndefined()
  })
})
