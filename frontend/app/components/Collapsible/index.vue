<template>
  <details ref="detailsEl" :class="detailsClassList" :open="forceOpen">
    <summary
      ref="summaryEl"
      class="flex cursor-pointer items-center justify-between marker:hidden"
      :class="summaryClassList"
      @click.prevent.capture="toggle"
    >
      <slot name="summary" />
    </summary>

    <div ref="contentPartEl">
      <slot name="details" />
    </div>
  </details>
</template>

<script lang="ts" setup>
const props = defineProps<{
  detailsClassList: string | string[]
  summaryClassList: string | string[]
  forceOpen: boolean | undefined
}>()

let animation: Animation | null
let isExpanding = false
let isShrinking = false
const isOpen = ref<boolean>(props.forceOpen)
const detailsEl = ref<HTMLDetailsElement | null>(null)
const summaryEl = ref<HTMLElement | null>(null)
const contentPartEl = ref<HTMLElement | null>(null)

defineExpose({
  toggle,
  isOpen,
})

function checkIfNotNull(e: Ref<HTMLElement | null>): e is Ref<HTMLElement> {
  return e && e.value !== null
}

/**
 * <details>/<summary> are notoriously hard to animate due to not being able to animate on the `open` attribute
 * or animating the height with CSS alone. However, we can animate them nicely by first grabbing the content's
 * height (which can be done, actually!), attaching an overflow-hidden _before_ opening, keeping the height at
 * 0 and animating it to the target height by hand. Reverse, and we've got a closing animation.
 */
function toggle() {
  if (
    !checkIfNotNull(detailsEl) ||
    !checkIfNotNull(summaryEl) ||
    !checkIfNotNull(contentPartEl)
  ) {
    return
  }

  const summaryStyles = getComputedStyle(summaryEl.value)
  const detailsStyles = getComputedStyle(detailsEl.value)

  // Summary height is basically the entire thing.
  // This is the start height of the animation when expanding
  // and the target height when shrinking
  const summaryHeight =
    summaryEl.value.offsetHeight +
    parseInt(summaryStyles.paddingTop) +
    parseInt(summaryStyles.paddingBottom) +
    parseInt(detailsStyles.paddingTop) +
    parseInt(detailsStyles.paddingBottom) +
    parseInt(detailsStyles.borderTopWidth) +
    parseInt(detailsStyles.borderBottomWidth)

  const contentHeight = contentPartEl.value.offsetHeight

  // Cancel any running animation to keep things snappy
  if (animation) {
    animation.cancel()
  }

  // Expansion
  if (!detailsEl.value.open || isShrinking) {
    isExpanding = true
    isShrinking = false
    isOpen.value = true
    // eslint-disable-next-line sonarjs/no-duplicate-string
    detailsEl.value.classList.add('overflow-hidden')
    detailsEl.value.style.height = `${summaryHeight}px`
    detailsEl.value.open = true
    detailsEl.value.classList.add('open')

    window.requestAnimationFrame(() => {
      animation = detailsEl.value!.animate(
        {
          height: [`${summaryHeight}px`, `${summaryHeight + contentHeight}px`],
        },
        {
          easing: 'ease-in-out',
          duration: 250,
        },
      )

      animation.onfinish = () => {
        isExpanding = false
        detailsEl.value.classList.remove('overflow-hidden')
        animation = null
        detailsEl.value.style.height = ''
      }
    })

    return
  }

  // Shrinking
  if (detailsEl.value.open || isExpanding) {
    isShrinking = true
    isExpanding = false
    isOpen.value = false
    detailsEl.value.classList.add('overflow-hidden')
    detailsEl.value.classList.remove('open')
    detailsEl.value.style.height = `${summaryHeight + contentHeight}px`

    window.requestAnimationFrame(() => {
      animation = detailsEl.value.animate(
        {
          height: [`${summaryHeight + contentHeight}px`, `${summaryHeight}px`],
        },
        {
          easing: 'ease-in-out',
          duration: 250,
        },
      )

      animation.onfinish = () => {
        isShrinking = false
        detailsEl.value.classList.remove('overflow-hidden')
        animation = null
        detailsEl.value.style.height = ''
        detailsEl.value.open = false
      }
    })
  }
}
</script>
