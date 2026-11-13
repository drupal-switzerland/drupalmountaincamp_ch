import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SponsorList from '../components/Paragraph/SponsorList/index.vue'
import TeaserDefault from '../components/Teaser/Default/index.vue'
import TeaserList from '../components/Paragraph/TeaserList/index.vue'

const { sponsors } = vi.hoisted(() => ({
  sponsors: [
    { uuid: 'a', year: '2027', tier: 'gold', title: 'Sponsor A' },
  ] as never[],
}))

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({ teaserStyle: 'grid', sliderStyle: 'stack' }),
}))

mockNuxtImport('useViewport', () => () => ({
  isSmUpwards: computed(() => false),
  isMdUpwards: computed(() => false),
}))

mockNuxtImport('useAllSponsors', () => async () => ({
  sponsors: ref(sponsors),
}))

// Renders the list's field as one teaser, as blökkli does for each item.
const TeaserFieldStub = defineComponent({
  setup() {
    return () => h(TeaserDefault, { title: 'Teaser', to: '/news/one' })
  },
})

const levelOf = (
  wrapper: { find: (selector: string) => { element: Element } },
  selector: string,
) => wrapper.find(selector).element.tagName.toLowerCase()

async function mountTeaserList(title: string) {
  return mountSuspended(TeaserList, {
    props: { title, paragraphs: [] },
    global: { stubs: { BlokkliField: TeaserFieldStub } },
  })
}

async function mountSponsorList(title: string) {
  return mountSuspended(SponsorList, {
    props: { title },
    global: { stubs: { SponsorTile: true } },
  })
}

describe('Heading levels in lists (WCAG 1.3.1)', () => {
  it('puts teasers one level below the teaser list title', async () => {
    const wrapper = await mountTeaserList('More news')

    expect(levelOf(wrapper, 'a :is(h2, h3)')).toBe('h3')
  })

  it('makes teasers the top heading of an untitled teaser list', async () => {
    const wrapper = await mountTeaserList('')

    expect(levelOf(wrapper, 'a :is(h2, h3)')).toBe('h2')
  })

  it('keeps h3 for a teaser outside a teaser list', async () => {
    const wrapper = await mountSuspended(TeaserDefault, {
      props: { title: 'Teaser', to: '/news/one' },
    })

    expect(levelOf(wrapper, 'h2, h3')).toBe('h3')
  })

  it('puts sponsor groups one level below the sponsor list title', async () => {
    const wrapper = await mountSponsorList('Sponsors')

    expect(levelOf(wrapper, 'section :is(h2, h3)')).toBe('h3')
  })

  it('makes sponsor groups the top heading of an untitled sponsor list', async () => {
    const wrapper = await mountSponsorList('')

    expect(levelOf(wrapper, 'section :is(h2, h3)')).toBe('h2')
  })
})
