import type { MaybeRefOrGetter, Ref } from 'vue'

const SCROLLER_SELECTOR = ':scope > table, figure.table'
const WIDE_CLASS = 'is-wide-table'
const SCROLLABLE_MARKER = 'data-scrollable-table'
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

function setScrollable(scroller: HTMLElement, fallbackLabel: string) {
  const caption = scroller.querySelector('caption')?.textContent?.trim()
  scroller.setAttribute(SCROLLABLE_MARKER, '')
  scroller.setAttribute('tabindex', '0')
  scroller.setAttribute('role', 'region')
  scroller.setAttribute('aria-label', caption || fallbackLabel)
}

// Only undo attributes this composable set, never ones from the content.
function unsetScrollable(scroller: HTMLElement) {
  if (!scroller.hasAttribute(SCROLLABLE_MARKER)) {
    return
  }
  for (const name of [SCROLLABLE_MARKER, 'tabindex', 'role', 'aria-label']) {
    scroller.removeAttribute(name)
  }
}

/**
 * Marks tables in v-html rich text that overflow their column: wide ones break
 * out of the column (if allowed), and any that still scroll become focusable
 * named regions so keyboard users can scroll them.
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
