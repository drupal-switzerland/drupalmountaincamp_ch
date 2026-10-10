import { describe, expect, it } from 'vitest'
import { defineComponent, h, inject } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Landing from '../components/Node/Page/Landing/index.vue'
import { IS_FRONT_PAGE } from '../composables/frontPage'

// Stands in for the page's blocks and shows what they are told.
const Blocks = defineComponent({
  inheritAttrs: false,
  setup: () => () =>
    h('output', String(inject(IS_FRONT_PAGE) ?? 'not provided')),
})

const Nothing = defineComponent({ inheritAttrs: false, render: () => null })

const Provider = defineComponent({
  inheritAttrs: false,
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.({ entity: undefined }),
})

async function blocksAreToldFrontPage(isFront?: boolean) {
  const wrapper = await mountSuspended(Landing, {
    props: { uuid: 'uuid', title: 'Title', isFront, blokkliProps: {} as never },
    global: {
      stubs: {
        BlokkliProvider: Provider,
        BlokkliField: Blocks,
        HomeHero: Nothing,
        MediaImage: Nothing,
        Container: Nothing,
      },
    },
  })
  return wrapper.get('output').text()
}

describe('landing page', () => {
  it('tells its blocks when they are on the homepage', async () => {
    expect(await blocksAreToldFrontPage(true)).toBe('true')
  })

  it('tells its blocks when they are on another page', async () => {
    expect(await blocksAreToldFrontPage(false)).toBe('false')
    expect(await blocksAreToldFrontPage()).toBe('false')
  })
})
