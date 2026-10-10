import type { MaybeRefOrGetter, Ref } from 'vue'

const WIDE_CLASS = 'is-wide-table'
const SCROLLABLE_MARKER = 'data-scrollable-table'
const WRAPPER_MARKER_VALUE = 'wrapper'
const SCROLLER_SELECTOR = `:scope > table, :scope > [${SCROLLABLE_MARKER}="${WRAPPER_MARKER_VALUE}"], figure.table`
const AVAILABLE_WIDTH_PROPERTY = '--wide-table-available-width'
const OVERFLOW_TOLERANCE_PX = 1

type Options = {
  /** Let wide tables grow beyond the column. Only for columns centred in their grid container. */
  breakout: MaybeRefOrGetter<boolean>
  enabled: boolean
  content: () => unknown
}

const overflows = (el: HTMLElement) =>
  el.scrollWidth - el.clientWidth > OVERFLOW_TOLERANCE_PX

function getAvailableWidth(column: HTMLElement): number {
  const container = column.closest<HTMLElement>('.grid-container')
  if (!container) {
    return column.clientWidth
  }
  const style = getComputedStyle(container)
  return (
    container.clientWidth -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  )
}

// A region role on the <table> itself would replace its table semantics, so
// a bare table scrolls in a wrapper and a CKEditor figure scrolls itself.
function wrapTable(table: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.setAttribute(SCROLLABLE_MARKER, WRAPPER_MARKER_VALUE)
  if (table.classList.contains(WIDE_CLASS)) {
    table.classList.remove(WIDE_CLASS)
    wrapper.classList.add(WIDE_CLASS)
  }
  table.replaceWith(wrapper)
  wrapper.append(table)
  return wrapper
}

function unwrapTable(wrapper: HTMLElement) {
  const table = wrapper.querySelector<HTMLElement>(':scope > table')
  if (!table) {
    wrapper.remove()
    return
  }
  table.classList.toggle(WIDE_CLASS, wrapper.classList.contains(WIDE_CLASS))
  wrapper.replaceWith(table)
}

function setScrollable(scroller: HTMLElement, fallbackLabel: string) {
  const region = scroller.tagName === 'TABLE' ? wrapTable(scroller) : scroller
  const caption = region.querySelector('caption')?.textContent?.trim()
  if (!region.hasAttribute(SCROLLABLE_MARKER)) {
    region.setAttribute(SCROLLABLE_MARKER, '')
  }
  region.setAttribute('tabindex', '0')
  region.setAttribute('role', 'region')
  region.setAttribute('aria-label', caption || fallbackLabel)
}

// Only undo attributes this composable set, never ones from the content.
function unsetScrollable(scroller: HTMLElement) {
  const marker = scroller.getAttribute(SCROLLABLE_MARKER)
  if (marker === WRAPPER_MARKER_VALUE) {
    unwrapTable(scroller)
    return
  }
  if (marker === null) {
    return
  }
  for (const name of [SCROLLABLE_MARKER, 'tabindex', 'role', 'aria-label']) {
    scroller.removeAttribute(name)
  }
}

/**
 * Marks tables in v-html rich text that overflow their column: wide ones break
 * out of the column (if allowed), and any that still scroll get a focusable
 * named region around them so keyboard users can scroll them.
 */
export default function (root: Ref<HTMLElement | null>, options: Options) {
  const { $texts } = useEasyTexts()
  const fallbackLabel = computed(() =>
    $texts('scrollableTable', 'Scrollable table'),
  )

  let lastColumnWidth = -1
  let observer: ResizeObserver | null = null

  function update() {
    const column = root.value
    if (!column) {
      return
    }
    const breakout = toValue(options.breakout)
    if (breakout) {
      column.style.setProperty(
        AVAILABLE_WIDTH_PROPERTY,
        `${getAvailableWidth(column)}px`,
      )
    }

    column
      .querySelectorAll<HTMLElement>(SCROLLER_SELECTOR)
      .forEach((scroller) => {
        scroller.classList.remove(WIDE_CLASS)
        if (breakout && overflows(scroller)) {
          scroller.classList.add(WIDE_CLASS)
        }
        if (overflows(scroller)) {
          setScrollable(scroller, fallbackLabel.value)
        } else {
          unsetScrollable(scroller)
        }
      })
  }

  onMounted(() => {
    if (!options.enabled || !root.value) {
      return
    }
    observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? -1
      if (width === lastColumnWidth) {
        return
      }
      lastColumnWidth = width
      update()
    })
    observer.observe(root.value)
    document.fonts.ready.then(update)
  })

  watch(options.content, () => options.enabled && update(), { flush: 'post' })

  onBeforeUnmount(() => observer?.disconnect())
}
