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
// A wrapper measures as the table it wraps; wideClient applies while the
// element breaks out of the column.
const sizes = new Map<
  string,
  { scroll: number; client: number; wideClient?: number }
>()

function sizeOf(el: HTMLElement) {
  const id =
    el.getAttribute('data-scrollable-table') === 'wrapper'
      ? el.firstElementChild?.id
      : el.id
  const size = id ? sizes.get(id) : undefined
  if (size?.wideClient && el.classList.contains('is-wide-table')) {
    return { ...size, client: size.wideClient }
  }
  return size
}

function stubSize(property: 'scrollWidth' | 'clientWidth') {
  const original = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    property,
  )
  const key = property === 'scrollWidth' ? 'scroll' : 'client'
  Object.defineProperty(HTMLElement.prototype, property, {
    configurable: true,
    get(this: HTMLElement) {
      return sizeOf(this)?.[key] ?? 0
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

function regionAround(wrapper: Wrapper, tableId: string): HTMLElement {
  const region = wrapper.get(`#${tableId}`).element.parentElement
  if (region?.getAttribute('data-scrollable-table') !== 'wrapper') {
    throw new Error(`#${tableId} is not wrapped in a scroll region`)
  }
  return region
}

describe('useScrollableTables', () => {
  it('makes an overflowing table a focusable region named by its caption', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t', 'Prices') })

    const region = regionAround(wrapper, 't')
    expect(region.getAttribute('role')).toBe('region')
    expect(region.getAttribute('tabindex')).toBe('0')
    expect(region.getAttribute('aria-label')).toBe('Prices')
  })

  it('keeps the table semantics by putting the region on a wrapper', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t', 'Prices') })

    const table = wrapper.get('#t')
    expect(table.attributes('role')).toBeUndefined()
    expect(table.attributes('tabindex')).toBeUndefined()
    expect(table.attributes('aria-label')).toBeUndefined()
    expect(table.find('caption').text()).toBe('Prices')
  })

  it('falls back to the generic label without a caption', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t') })

    expect(regionAround(wrapper, 't').getAttribute('aria-label')).toBe(
      'scrollableTable',
    )
  })

  it('handles CKEditor table figures', async () => {
    sizes.set('f', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: `<figure id="f" class="table">${wideTable('inner')}</figure>`,
    })

    expect(wrapper.get('#f').attributes('role')).toBe('region')
    expect(wrapper.get('#inner').attributes('role')).toBeUndefined()
    expect(wrapper.get('#inner').element.parentElement?.id).toBe('f')
  })

  it('ignores tables nested in other markup', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: `<div>${wideTable('t')}</div>`,
    })

    expect(wrapper.get('#t').attributes('role')).toBeUndefined()
  })

  it('wraps a table that fits, within a pixel of tolerance, without a region', async () => {
    sizes.set('t', { scroll: 601, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t') })

    const plain = wrapper.get('#t').element.parentElement!
    expect(plain.getAttribute('data-scrollable-table')).toBe('wrapper')
    for (const el of [plain, wrapper.get('#t').element]) {
      expect(el.getAttribute('role')).toBeNull()
      expect(el.getAttribute('tabindex')).toBeNull()
      expect(el.getAttribute('aria-label')).toBeNull()
    }
  })

  it('drops the region once a table fits again, leaving authored markup alone', async () => {
    sizes.set('mine', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html:
        wideTable('mine') +
        '<table id="authored" role="grid" aria-label="Authored"></table>',
    })
    expect(regionAround(wrapper, 'mine').getAttribute('role')).toBe('region')

    sizes.set('mine', { scroll: 600, client: 600 })
    await wrapper.setProps({ version: 1 })

    const plain = regionAround(wrapper, 'mine')
    expect(plain.getAttribute('role')).toBeNull()
    expect(plain.getAttribute('tabindex')).toBeNull()
    expect(plain.getAttribute('aria-label')).toBeNull()
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

    expect(regionAround(wrapper, 't').classList).toContain('is-wide-table')
    expect(wrapper.get('#t').classes()).not.toContain('is-wide-table')
    expect(
      (wrapper.get('#column').element as HTMLElement).style.getPropertyValue(
        '--wide-table-available-width',
      ),
    ).toBe('1100px')
  })

  it('keeps tables in the column without breakout', async () => {
    sizes.set('t', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({ html: wideTable('t') })

    expect(regionAround(wrapper, 't').classList).not.toContain('is-wide-table')
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

    expect(wrapper.get('#t').element.parentElement?.id).toBe('column')
  })

  it('keeps a table that fits once broken out wide, without a region', async () => {
    sizes.set('grid', { scroll: 1200, client: 1200 })
    sizes.set('t', { scroll: 900, client: 600, wideClient: 1000 })
    const wrapper = await mountRichText({
      html: wideTable('t'),
      breakout: true,
    })

    const plain = regionAround(wrapper, 't')
    expect(plain.classList).toContain('is-wide-table')
    expect(plain.getAttribute('role')).toBeNull()
    expect(wrapper.get('#t').classes()).not.toContain('is-wide-table')
  })

  it('names a CKEditor table figure by its figcaption', async () => {
    sizes.set('f', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: `<figure id="f" class="table">${wideTable('inner')}<figcaption> Schedule </figcaption></figure>`,
    })

    expect(wrapper.get('#f').attributes('aria-label')).toBe('Schedule')
    expect(wrapper.get('figcaption').attributes('id')).toBeUndefined()
  })

  it('falls back to the generic label for a figure without a caption', async () => {
    sizes.set('f', { scroll: 900, client: 600 })
    const wrapper = await mountRichText({
      html: `<figure id="f" class="table">${wideTable('inner')}</figure>`,
    })

    expect(wrapper.get('#f').attributes('aria-label')).toBe('scrollableTable')
  })
})
