<template>
  <!-- Always rendered: a live region only announces what is added after it
       exists. aria-live without role="status" reads the new message alone,
       not every message again. The messages are put in only once the region
       is in the page (see isRegionReady). -->
  <div
    ref="region"
    aria-live="polite"
    class="fixed bottom-0 left-0 z-[9999999] w-full text-white"
  >
    <!-- Keyed by its text, which is unique in the list: with an index as key
         the next message would move into a dismissed one's element and be
         read out again. -->
    <div
      v-for="(message, i) in isRegionReady ? messages : []"
      :key="message.message"
      class="flex items-center justify-between rounded p-6 font-medium"
      :class="classes[message.type]"
      @click="removeMessage(i)"
    >
      <div>
        <span v-if="typeLabels[message.type]" class="sr-only">
          {{ typeLabels[message.type] }}:
        </span>
        <div v-html="message.message" />
      </div>
      <button
        type="button"
        class="shrink-0"
        :aria-label="$texts('messages.dismiss', 'Dismiss message')"
        @click.stop="dismissFromButton(i, $event)"
      >
        <SpriteSymbol name="close" class="block size-6" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DrupalMessageType } from '~/composables/useDrupalMessages'

/** The skip link target in layouts/default.vue. */
const MAIN_CONTENT_ID = 'main-content'

const { messages, removeMessage } = useDrupalMessages()
const { $texts } = useEasyTexts()
const region = ref<HTMLElement | null>(null)

// Messages that came with the page (after a save, say) are already in the
// state when the region mounts. They go in two frames later, so that they are
// added to a region that is on the page rather than arriving with it. On the
// SPA shell for logged-in users the whole page is attached after this
// component's onMounted, so a tick or the load event would still put them in
// with the region (measured).
const isRegionReady = ref(false)
onMounted(() => {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (isRegionReady.value = true)),
  )
})

const classes: Record<DrupalMessageType, string> = {
  error: 'bg-error-100 text-error-800',
  warning: 'bg-warning-100 text-warning-800',
  status: 'bg-success-100 text-success-800',
}

// Colour alone tells errors and warnings apart from status messages.
const typeLabels = computed<Partial<Record<DrupalMessageType, string>>>(() => ({
  error: $texts('messages.error', 'Error'),
  warning: $texts('messages.warning', 'Warning'),
}))

// The button that had focus is removed with its message. Focus goes to the
// message that takes its place, else to the one before, else to main.
async function dismissFromButton(index: number, event: Event) {
  const hadFocus = document.activeElement === event.currentTarget
  removeMessage(index)
  if (!hadFocus) {
    return
  }
  await nextTick()
  const buttons = region.value?.querySelectorAll('button') ?? []
  const next =
    buttons[index] ??
    buttons[index - 1] ??
    document.getElementById(MAIN_CONTENT_ID)
  next?.focus({ preventScroll: true })
}
</script>
