import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Landing from '../components/Node/Page/Landing/index.vue'
import PressRelease from '../components/Node/PressRelease/index.vue'

const Nothing = defineComponent({ inheritAttrs: false, render: () => null })
const Image = defineComponent({
  inheritAttrs: false,
  setup: () => () => h('img'),
})

// The editor's provider hands the entity being edited to its slot.
const providerWith = (entity: Record<string, unknown> | undefined) =>
  defineComponent({
    inheritAttrs: false,
    setup:
      (_, { slots }) =>
      () =>
        slots.default?.({ entity }),
  })

async function mount(
  component: typeof Landing | typeof PressRelease,
  props: Record<string, unknown>,
  entity?: Record<string, unknown>,
) {
  const wrapper = await mountSuspended(component as never, {
    props: {
      uuid: 'node-uuid',
      title: 'Title',
      blokkliProps: {},
      ...props,
    } as never,
    global: {
      stubs: {
        BlokkliProvider: providerWith(entity),
        BlokkliField: Nothing,
        MediaImage: Image,
        HomeHero: Nothing,
      },
      directives: { blokkliEditable: {}, blokkliDroppable: {} },
    },
  })
  return { wrapper }
}

// The drop target wrapper itself only renders while editing, which the test
// build cannot switch on.
describe('node header image', () => {
  // While editing, the provider's entity carries the image being edited.
  it.each([
    ['landing page', Landing, 'hero'],
    ['news article', PressRelease, 'image'],
  ] as const)(
    'shows the %s image the editor holds when the props have none',
    async (_name, component, prop) => {
      const { wrapper } = await mount(component, {}, { [prop]: {} })

      expect(wrapper.findAll('img')).toHaveLength(1)
    },
  )
})
