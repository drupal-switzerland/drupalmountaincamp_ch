<template>
  <div
    v-if="messages.length"
    class="fixed bottom-0 left-0 z-[9999999] w-full text-white"
  >
    <div
      v-for="(message, i) in messages"
      :key="i"
      class="flex items-center justify-between rounded p-6 font-medium"
      :class="classes[message.type]"
      @click="removeMessage(i)"
    >
      <div v-html="message.message" />
      <SpriteSymbol name="close" class="size-6" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DrupalMessageType } from '~/composables/useDrupalMessages'

const { messages, removeMessage } = useDrupalMessages()

const classes: Record<DrupalMessageType, string> = {
  error: 'bg-error-100 text-error-800',
  warning: 'bg-warning-100 text-warning-800',
  status: 'bg-success-100 text-success-800',
}
</script>
