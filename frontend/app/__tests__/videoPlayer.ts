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
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        slots.default?.({
          embedUrl: 'https://example.com/embed',
          thumbnailUrl: '',
        }),
      )
  },
})

async function mountVideo(props: Record<string, unknown>) {
  return mountSuspended(Video, {
    props: { video: { url: 'https://youtu.be/x' }, ...props },
    global: { stubs: { VuepalRemoteVideo: RemoteVideoStub } },
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
})
