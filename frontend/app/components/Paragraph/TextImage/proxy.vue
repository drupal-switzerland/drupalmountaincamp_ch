<template>
  <div>
    <MediaImage
      v-blokkli-droppable:field_image
      v-bind="image"
      :image-style="imageStyle"
      hide-caption
      class="max-w-32"
    />
    <div v-blokkli-editable:field_title>{{ title }}</div>
    <div
      v-blokkli-editable:field_text
      class="ck-content hyphens-auto"
      v-html="text"
    />
  </div>
</template>

<script setup lang="ts">
import type { ParagraphTextImageFragment } from '#graphql-operations'

defineProps<{
  title?: string
  text?: string
  image: ParagraphTextImageFragment['image']
}>()

const imageStyle = defineImageStyle({
  type: 'single',
  aspectRatio: 4 / 3,
  width: 440,
})
</script>
