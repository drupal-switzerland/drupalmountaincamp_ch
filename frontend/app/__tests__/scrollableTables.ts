import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import useScrollableTables from '../composables/useScrollableTables'

// The easy-texts build transform strips the default text from $texts()
// calls, so the mock answers with the key the composable asked for.
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

// happy-dom does no layout, so element sizes come from this map, keyed by id.
const sizes = new Map<string, { scroll: number; client: number }>()

function stubSize(property: 'scrollWidth' | 'clientWidth') {
  const original = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    property,
  )
  const key = property === 'scrollWidth' ? 'scroll' : 'client'
  Object.defineProperty(HTMLElement.prototype, property, {
    configurable: true,
    get(this: HTMLElement) {
      return sizes.get(this.id)?.[key] ?? 0
    },
  })
  return () => {
    if (original) {
      Object.defineProperty(HTMLElement.prototype, property, original)
    }
  }
}

const restoreSizes: (() => void)[] = []

beforeAll(() => {
  restoreSizes.push(stubSize('scrollWidth'), stubSize('clientWidth'))
  // happy-dom has no FontFaceSet.
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready: Promise.resolve() },
  })
})

afterAll(() => {
  restoreSizes.forEach((restore) => restore())
  Reflect.deleteProperty(document, 'fonts')
})

beforeEach(() => {
  sizes.clear()
})

const RichText = defineComponent({
  props: {
    html: { type: String, required: true },
    version: { type: Number, default: 0 },
    breakout: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    gridPadding: { type: Number, default: 0 },
  },
  setup(props) {
    const root = ref<HTMLElement | null>(null)
    useScrollableTables(root, {
      breakout: () => props.breakout,
      enabled: props.enabled,
      content: () => props.version,
    })
    return () =>
      h(
        'div',
        {
          id: 'grid',
          class: 'grid-container',
          style: {
            paddingLeft: `${props.gridPadding}px`,
            paddingRight: `${props.gridPadding}px`,
          },
        },
        [h('div', { id: 'column', ref: root, innerHTML: props.html })],
      )
  },
})

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>
const mounted: Wrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

// Attached so getComputedStyle sees the grid container's padding.
async function mountRichText(props: InstanceType<typeof RichText>['$props']) {
  const wrapper = await mountSuspended(RichText, {
    props,
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

function wideTable(id: string, caption = '') {
  const captionHtml = caption ? `<caption> ${caption} </caption>` : ''
  return `<table id="${id}">${captionHtml}<tr><td>x</td></tr></table>`
}

describe('useScrollableTables', () => {
  it('makes an overflowing table a focusable region named by its caption', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t', 'Prices') })

    const table = wrapper.get('#t')
    expect(table.attributes('role')).toBe('region')
    expect(table.attributes('tabindex')).toBe('0')
    expect(table.attributes('aria-label')).toBe('Prices')
  })

  it('falls back to the generic label without a caption', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t') })

    expect(wrapper.get('#t').attributes('aria-label')).toBe('scrollableTable')
  })

  it('handles CKEditor table figures', async () => {
    sizes.set('f', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: `<figure id="f" class="table">${wideTable('inner')}</figure>`,
    })

    expect(wrapper.get('#f').attributes('role')).toBe('region')
    expect(wrapper.get('#inner').attributes('role')).toBeUndefined()
  })

  it('ignores tables nested in other markup', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: `<div>${wideTable('t')}</div>`,
    })

    expect(wrapper.get('#t').attributes('role')).toBeUndefined()
  })

  it('leaves tables that fit, within a pixel of tolerance, alone', async () => {
    sizes.set('t', { scroll: 601, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t') })

    const table = wrapper.get('#t')
    expect(table.attributes('role')).toBeUndefined()
    expect(table.attributes('tabindex')).toBeUndefined()
    expect(table.attributes('aria-label')).toBeUndefined()
  })

  it('removes only its own attributes once a table fits again', async () => {
    sizes.set('mine', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html:
        wideTable('mine') +
        '<table id="authored" role="grid" aria-label="Authored"></table>',
    })
    expect(wrapper.get('#mine').attributes('role')).toBe('region')

    sizes.set('mine', { scroll: 600, client: 600 })
    await wrapper.setProps({ version: 1 })

    expect(wrapper.get('#mine').attributes('role')).toBeUndefined()
    expect(wrapper.get('#mine').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('#authored').attributes('role')).toBe('grid')
    expect(wrapper.get('#authored').attributes('aria-label')).toBe('Authored')
  })

  it('lets wide tables break out and exposes the available width', async () => {
    sizes.set('grid', { scroll: 1200, client: 1200 })
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: wideTable('t'),
      breakout: true,
      gridPadding: 50,
    })

    expect(wrapper.get('#t').classes()).toContain('is-wide-table')
    expect(
      (wrapper.get('#column').element as HTMLElement).style.getPropertyValue(
        '--wide-table-available-width',
      ),
    ).toBe('1100px')
  })

  it('keeps tables in the column without breakout', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t') })

    expect(wrapper.get('#t').classes()).not.toContain('is-wide-table')
    expect(
      (wrapper.get('#column').element as HTMLElement).style.getPropertyValue(
        '--wide-table-available-width',
      ),
    ).toBe('')
  })

  it('does nothing when disabled', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: wideTable('t'),
      enabled: false,
    })
    await wrapper.setProps({ version: 1 })

    expect(wrapper.get('#t').attributes('role')).toBeUndefined()
  })
})
