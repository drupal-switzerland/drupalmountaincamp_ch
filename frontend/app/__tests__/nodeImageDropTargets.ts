import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import PressRelease from '../components/Node/PressRelease/index.vue'

// The easy-texts build transform strips the default text from $texts()
// calls, so the mock answers with the key the component asked for.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const Nothing = defineComponent({ inheritAttrs: false, render: () => null })
const Image = defineComponent({
  inheritAttrs: false,
  setup: () => () => h('img'),
})

// The editor's provider hands the entity being edited and the editing state
// to its slot.
const providerWith = (
  entity: Record<string, unknown> | undefined,
  isEditing: boolean,
) =>
  defineComponent({
    inheritAttrs: false,
    setup:
      (_, { slots }) =>
      () =>
        slots.default?.({ entity, isEditing }),
  })

const IMAGE_SLOT = '.grid-container-6'

async function mount(
  props: Record<string, unknown>,
  {
    entity,
    isEditing = false,
  }: {
    entity?: Record<string, unknown>
    isEditing?: boolean
  } = {},
) {
  return mountSuspended(PressRelease as never, {
    props: {
      uuid: 'node-uuid',
      title: 'Title',
      blokkliProps: {},
      ...props,
    } as never,
    global: {
      stubs: {
        BlokkliProvider: providerWith(entity, isEditing),
        BlokkliField: Nothing,
        MediaImage: Image,
      },
      directives: { blokkliEditable: {}, blokkliDroppable: {} },
    },
  })
}

describe('news article image', () => {
  it('shows the image the editor holds when the props have none', async () => {
    const wrapper = await mount({}, { entity: { image: {} }, isEditing: true })

    expect(wrapper.findAll('img')).toHaveLength(1)
  })

  it('gives an article without an image a visible drop target while editing', async () => {
    const wrapper = await mount({}, { isEditing: true })
    const slot = wrapper.get(IMAGE_SLOT)

    expect(slot.findAll('p')).toHaveLength(1)
    expect(slot.get('p').text()).toBe('pressRelease.imageDropHint')
    expect(slot.find('img').exists()).toBe(false)
  })

  it('renders nothing for a missing image outside the editor', async () => {
    const wrapper = await mount({})

    expect(wrapper.get(IMAGE_SLOT).element.children).toHaveLength(0)
  })

  it('renders only the image, unwrapped, outside the editor', async () => {
    const wrapper = await mount({ image: {} })
    const children = [...wrapper.get(IMAGE_SLOT).element.children]

    expect(children.map((c) => c.tagName)).toEqual(['IMG'])
  })
})
