<template>
  <div
    class="col-span-4 flex flex-col items-center gap-4 border-b pb-8 sm:col-span-6 sm:flex-row sm:items-start sm:py-8 md:col-span-4 lg:col-span-6"
  >
    <div v-blokkli-droppable:field_icon class="sm:w-[207px]">
      <MediaIcon
        v-if="icon"
        v-bind="icon"
        class="mx-10 mt-10 size-[50px] fill-primary-500 lg:mx-0 lg:mt-0 lg:size-[100px]"
      />
    </div>
    <div class="grid">
      <h3 v-blokkli-editable:field_title class="col-span-7 mb-2 text-3xl">
        {{ title }}
      </h3>
      <div
        v-blokkli-editable:field_text
        class="ck-content col-span-7 hyphens-auto lg:hyphens-none"
        v-html="text"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphIconTextItemFragment } from '#graphql-operations'

defineProps<{
  icon: ParagraphIconTextItemFragment['icon']
  text: ParagraphIconTextItemFragment['text']
  title: ParagraphIconTextItemFragment['title']
}>()

defineBlokkli({
  bundle: 'icon_text_item',
})
</script>
