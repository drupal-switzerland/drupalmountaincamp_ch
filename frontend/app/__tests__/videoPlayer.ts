import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Video from '../components/Paragraph/Video/index.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({ format: 'full', spacing: 'none' }),
}))

const RemoteVideoStub = defineComponent({
  props: { thumbnail: { type: String, default: '' } },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        slots.default?.({
          embedUrl: 'https://example.com/embed',
          thumbnailUrl: props.thumbnail,
        }),
      )
  },
})

async function mountVideo(props: Record<string, unknown>, thumbnail = '') {
  const RemoteVideo = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h(RemoteVideoStub, { thumbnail }, slots),
  })
  return mountSuspended(Video, {
    props: { video: { url: 'https://youtu.be/x' }, ...props },
    global: { stubs: { VuepalRemoteVideo: RemoteVideo } },
    attachTo: document.body,
  })
}

describe('video paragraph', () => {
  it('names the player by the paragraph title and focuses it on play', async () => {
    const wrapper = await mountVideo({ title: 'Opening keynote' })
    await wrapper.get('button').trigger('click')
    await nextTick()

    const iframe = wrapper.get('iframe')
    expect(iframe.attributes('title')).toBe('Opening keynote')
    expect(document.activeElement).toBe(iframe.element)
    wrapper.unmount()
  })

  it('falls back to the description, then a generic name', async () => {
    const described = await mountVideo({ videoDescription: 'Fondue night' })
    await described.get('button').trigger('click')
    expect(described.get('iframe').attributes('title')).toBe('Fondue night')
    described.unmount()

    const bare = await mountVideo({})
    await bare.get('button').trigger('click')
    expect(bare.get('iframe').attributes('title')).toBe('video.player')
    bare.unmount()
  })

  it('names each play button by its video', async () => {
    const titled = await mountVideo({
      title: 'Opening keynote',
      videoDescription: 'Fondue night',
    })
    const described = await mountVideo({ videoDescription: 'Fondue night' })
    const bare = await mountVideo({})

    expect(titled.get('button').attributes('aria-label')).toBe(
      'video.load: Opening keynote',
    )
    expect(described.get('button').attributes('aria-label')).toBe(
      'video.load: Fondue night',
    )
    expect(bare.get('button').attributes('aria-label')).toBe('video.load')
    for (const wrapper of [titled, described, bare]) wrapper.unmount()
  })

  it('shows decorative, lazy-loaded fallback thumbnails', async () => {
    const remote = await mountVideo(
      { videoDescription: 'Fondue night' },
      'https://img.youtube.com/vi/x/0.jpg',
    )
    const original = await mountVideo({ videoDescription: 'Fondue night' })

    for (const wrapper of [remote, original]) {
      const img = wrapper.get('button img')
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('loading')).toBe('lazy')
      wrapper.unmount()
    }
  })
})
