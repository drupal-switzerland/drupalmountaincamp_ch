import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PressRelease from '../components/Node/PressRelease/index.vue'

const Nothing = defineComponent({ inheritAttrs: false, render: () => null })

const Provider = defineComponent({
  inheritAttrs: false,
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.({ entity: undefined }),
})

// Shows the loading hints the article gives its image.
const Image = defineComponent({
  inheritAttrs: false,
  props: { preload: Boolean, loading: { type: String, default: 'lazy' } },
  setup: (props) => () =>
    h('output', `${props.loading} ${props.preload ? 'preload' : 'no preload'}`),
})

type Props = InstanceType<typeof PressRelease>['$props']

const mountArticle = (props: Partial<Props>) =>
  mountSuspended(PressRelease, {
    props: { title: 'Title', blokkliProps: {} as never, ...props },
    global: {
      stubs: {
        BlokkliProvider: Provider,
        BlokkliField: Nothing,
        MediaImage: Image,
      },
      directives: { blokkliEditable: {}, blokkliDroppable: {} },
    },
  })

describe('news article', () => {
  it('gives its date in machine-readable form', async () => {
    const wrapper = await mountArticle({
      date: { formatted: '6. March 2026', value: '2026-03-06' },
    })

    const time = wrapper.get('time')
    expect(time.attributes('datetime')).toBe('2026-03-06')
    expect(time.text()).toBe('6. March 2026')
  })

  it('shows a date without a machine-readable value as plain text', async () => {
    const wrapper = await mountArticle({
      date: { formatted: '6. March 2026' },
    })

    expect(wrapper.find('time').exists()).toBe(false)
    expect(wrapper.text()).toContain('6. March 2026')
  })

  it('loads its image eagerly with high priority', async () => {
    const wrapper = await mountArticle({ image: {} as never })

    expect(wrapper.get('output').text()).toBe('eager preload')
  })
})
