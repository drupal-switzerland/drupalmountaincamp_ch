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

// The element carrying v-blokkli-droppable:field_image.
const DROP_TARGET = '.grid-container-6 > div'

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

    expect(wrapper.get(DROP_TARGET).text()).toBe('pressRelease.imageDropHint')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('renders nothing for a missing image outside the editor', async () => {
    const wrapper = await mount({})

    expect(wrapper.find(DROP_TARGET).exists()).toBe(false)
  })

  it('makes the image the drop target outside the editor too', async () => {
    const wrapper = await mount({ image: {} })

    expect(wrapper.get(DROP_TARGET).find('img').exists()).toBe(true)
  })
})
