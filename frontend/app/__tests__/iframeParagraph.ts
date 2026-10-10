import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Iframe from '../components/Paragraph/Iframe/index.vue'

// The build replaces the default text with a lookup, so the key stands in for
// the translated title here.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({ spacing: 'none' }),
}))

const EMBED_URL = 'https://www.youtube-nocookie.com/embed/n8evE6opHOg'

describe('iframe paragraph', () => {
  it('renders a lazily loaded iframe with the URL and a title', async () => {
    const wrapper = await mountSuspended(Iframe, {
      props: { url: { uri: { path: EMBED_URL } } },
    })
    const iframe = wrapper.get('iframe')

    expect(iframe.attributes('src')).toBe(EMBED_URL)
    expect(iframe.attributes('title')).toBe('iframe.title')
    expect(iframe.attributes('loading')).toBe('lazy')
  })
})
