import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SpeakerCard from '../components/Paragraph/SpeakerCard/index.vue'
import SpeakerList from '../components/Paragraph/SpeakerList/index.vue'
import { SPEAKER_CARD_HEADING } from '../composables/speakerCardHeading'
import { sizesProblems } from './support/sizes'

// The easy-texts build transform strips the default text from $texts()
// calls, so the mock answers with the key the component asked for.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

// Lists saved before the Keynote/Featured option was removed still carry it
// in their stored options; the tests can set it to show it is ignored.
const { stored } = vi.hoisted(() => ({
  stored: { options: { spacing: 'none' } as Record<string, string> },
}))

mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(0),
  parentType: ref('speaker_list'),
  options: ref(stored.options),
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

function mountCard(props: Record<string, unknown>, heading?: 'h2' | 'h3') {
  return mountSuspended(SpeakerCard, {
    props,
    global: {
      provide: heading
        ? { [SPEAKER_CARD_HEADING as symbol]: computed(() => heading) }
        : {},
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

async function mountList(
  title: string | undefined,
  options: Record<string, string> = { spacing: 'none' },
) {
  stored.options = options
  return mountSuspended(SpeakerList, {
    props: { title, paragraphs: [{ props: filled }] as never },
    global: { stubs: { BlokkliField: FieldStub } },
  })
}

describe('speaker card', () => {
  beforeEach(() => {
    stored.options = { spacing: 'none' }
  })

  it('shows a speaker as the white bordered card, without the old keynote styling', async () => {
    const wrapper = await mountCard(filled)
    const article = wrapper.get('article')

    expect(article.classes()).toContain('gradient-border')
    expect(article.classes()).not.toContain('speaker-card-keynote')
    expect(article.classes()).not.toContain('on-dark')
    expect(wrapper.find('.label').exists()).toBe(false)
    expect(wrapper.get('h3').text()).toBe('Speaker name')
  })

  it('shows the photo whole, with its own width and height', async () => {
    const wrapper = await mountCard(filled)
    const img = wrapper.get('img')

    expect(img.attributes('style') ?? '').not.toContain('aspect-ratio')
    expect(img.attributes('style') ?? '').not.toContain('object-fit')
    expect(img.classes().filter((c) => c.startsWith('object-'))).toEqual([])
    expect(img.attributes('width')).toBe('1090')
    expect(img.attributes('height')).toBe('727')
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
      format: ' ',
      sessionTitle: '',
      summary: '',
    })

    expect(wrapper.find('h3').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.findAll('p')).toHaveLength(0)
  })

  it('shows the format right after the name, before the session title', async () => {
    const wrapper = await mountCard({ ...filled, format: 'Keynote' })
    const format = wrapper.get('h3').element.nextElementSibling

    expect(format?.tagName).toBe('P')
    expect(format?.textContent?.trim()).toBe('Keynote')
    expect(format?.nextElementSibling?.textContent).toContain('Session title')
  })

  it('puts the format as a badge over the photo, without changing the reading order', async () => {
    const wrapper = await mountCard({ ...filled, format: 'Keynote' })
    const badge = wrapper.get('h3').element.nextElementSibling as HTMLElement

    expect(badge.textContent?.trim()).toBe('Keynote')
    expect(badge.closest('a, button')).toBeNull()
    expect([...badge.classList]).toEqual(
      expect.arrayContaining([
        'absolute',
        'rounded-2xl',
        'bg-primary-500',
        'text-white',
        'uppercase',
      ]),
    )
    // Positioned against the card, whose first child is the photo.
    expect(wrapper.get('article').classes()).toContain('relative')
    expect(
      wrapper.get('article').element.firstElementChild?.querySelector('img'),
    ).not.toBeNull()
  })

  it('keeps a long format inside the photo and lets it wrap', async () => {
    const label = 'Panel discussion with community leaders'
    const wrapper = await mountCard({ ...filled, format: label })
    const badge = wrapper.get('h3').element.nextElementSibling as HTMLElement

    expect(badge.textContent?.trim()).toBe(label)
    // Inset on both sides, as wide as its text up to that.
    expect([...badge.classList]).toEqual(
      expect.arrayContaining(['left-3', 'right-3', 'w-fit']),
    )
    for (const cls of ['truncate', 'whitespace-nowrap', 'overflow-hidden']) {
      expect([...badge.classList]).not.toContain(cls)
    }
  })

  it('shows the format inline under the name on a card without a photo', async () => {
    const wrapper = await mountCard({
      ...filled,
      image: undefined,
      format: 'Keynote',
    })
    const format = wrapper.get('h3').element.nextElementSibling as HTMLElement

    expect(format.textContent?.trim()).toBe('Keynote')
    expect([...format.classList]).not.toContain('absolute')
    expect([...format.classList]).not.toContain('bg-primary-500')
    expect([...format.classList]).toContain('text-primary-500')
  })

  it('shows a format without a session title, as for a fireside chat', async () => {
    const wrapper = await mountCard({
      name: 'Speaker name',
      format: 'Fireside Chat',
      image,
    })
    const paragraphs = wrapper.findAll('p')

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]!.text()).toBe('Fireside Chat')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it.each([undefined, '   '])(
    'renders no format line and no empty badge for the format %j',
    async (format) => {
      const wrapper = await mountCard({ ...filled, format })

      expect(
        wrapper.get('h3').element.nextElementSibling?.textContent,
      ).toContain('Session title')
      expect(wrapper.find('p.rounded-2xl').exists()).toBe(false)
    },
  )

  it.each(['h2', 'h3'] as const)(
    'sets the name as %s in the same weight',
    async (heading) => {
      const wrapper = await mountCard(filled, heading)
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

  it('takes the photo’s alternative text from the media', async () => {
    const wrapper = await mountCard(filled)

    expect(wrapper.get('img').attributes('alt')).toBe('Portrait of the speaker')
  })

  it('gives the photo a sizes value browsers can read', async () => {
    const wrapper = await mountCard(filled)

    expect(sizesProblems(wrapper.get('img').attributes('sizes')!)).toEqual([])
  })
})

describe('speaker list', () => {
  it('titles the block with an h2 above h3 speaker names', async () => {
    const wrapper = await mountList('Keynote speakers')
    const section = wrapper.get('section')

    expect(section.get('h2').text()).toBe('Keynote speakers')
    expect(section.attributes('aria-labelledby')).toBe(
      section.get('h2').attributes('id'),
    )
    expect(section.get('h3').text()).toBe('Speaker name')
  })

  it('puts cards three to a row from lg, as tall as the tallest in the row', async () => {
    const wrapper = await mountList('Speakers')
    const grid = wrapper.get('section > div')
    const article = grid.get('article')

    expect(grid.classes()).toEqual(
      expect.arrayContaining(['grid', 'sm:grid-cols-2', 'lg:grid-cols-3']),
    )
    // Grid items stretch by default; any of these would undo it.
    for (const cls of ['items-start', 'items-center', 'items-end']) {
      expect(grid.classes()).not.toContain(cls)
    }
    expect(article.classes()).not.toContain('self-start')
    // The text area takes the height the stretched card gains.
    expect(article.classes()).toContain('flex-col')
    expect(article.get('h3').element.parentElement!.classList).toContain(
      'flex-1',
    )
  })

  it('renders the same white card for a list saved with the old keynote option', async () => {
    const wrapper = await mountList('Keynote speakers', {
      spacing: 'none',
      variant: 'keynote',
    })
    const article = wrapper.get('article')

    expect(article.classes()).toContain('gradient-border')
    expect(article.classes()).not.toContain('speaker-card-keynote')
    expect(wrapper.find('.label').exists()).toBe(false)
  })

  it('marks itself as a speaker list, for the gap between two lists', async () => {
    const wrapper = await mountList('Speakers')

    expect(wrapper.get('section').classes()).toContain('speaker-list')
  })

  it('makes the speaker names the h2 when the block has no title', async () => {
    const wrapper = await mountList('  ')
    const section = wrapper.get('section')

    expect(section.findAll('h2').map((h) => h.text())).toEqual(['Speaker name'])
    expect(section.find('h3').exists()).toBe(false)
    expect(section.attributes('aria-labelledby')).toBeUndefined()
  })
})
