<template>
  <div
    class="relative"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <slot />
    <div
      v-if="copyright"
      class="absolute bottom-2 end-2 flex max-w-[calc(100%-1rem)] items-center rounded-xl bg-primary-500/90 text-sm text-white"
    >
      <button
        type="button"
        class="flex size-6 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:ring-4 focus-visible:ring-primary-500"
        :aria-label="$texts('imageCredit.toggle', 'Photo credit')"
        :aria-expanded="isOpen"
        :aria-controls="creditId"
        @click="isPinned = !isPinned"
      >
        <span aria-hidden="true">&copy;</span>
      </button>
      <span
        :id="creditId"
        class="pe-3"
        :class="{ 'hidden print:inline': !isOpen }"
      >
        {{ copyright }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'

defineOptions({
  name: 'ImageCredit',
})

withDefaults(
  defineProps<{
    copyright?: string
  }>(),
  {
    copyright: '',
  },
)

const { $texts } = useEasyTexts()

const creditId = useId()
const isPinned = ref(false)
const isHovered = ref(false)
const isDismissed = ref(false)
const isOpen = computed(
  () => isPinned.value || (isHovered.value && !isDismissed.value),
)

// Touch has no hover: a tap would leave the credit stuck open.
function onPointerEnter(event: PointerEvent) {
  isHovered.value = event.pointerType === 'mouse'
  isDismissed.value = false
}

function onPointerLeave() {
  isHovered.value = false
  isDismissed.value = false
}

// WCAG 1.4.13: content shown on hover has to be dismissible without moving the pointer.
useEventListener(
  () => (isOpen.value ? window : null),
  'keydown',
  (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return
    }
    isPinned.value = false
    isDismissed.value = true
  },
)
</script>
