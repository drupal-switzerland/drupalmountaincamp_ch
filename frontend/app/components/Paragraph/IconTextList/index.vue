<template>
  <div class="grid-container" :open="isEditing" :class="paragraphClassList">
    <div class="col-span-4 sm:col-span-6 md:col-span-8 lg:col-span-12">
      <h2 v-blokkli-editable:field_title class="mb-5 text-lg lg:text-4xl">
        {{ title }}
      </h2>
      <div
        v-blokkli-editable:field_text
        class="ck-content hyphens-auto lg:hyphens-none"
        v-html="text"
      />
      <BlokkliField
        :list="paragraphs"
        name="field_content"
        class="grid-container py-20"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphIconTextListFragment } from '#graphql-operations'

defineProps<{
  text: ParagraphIconTextListFragment['text']
  title: ParagraphIconTextListFragment['title']
  paragraphs: ParagraphIconTextListFragment['paragraphs']
}>()

const { isEditing, options } = defineBlokkli({
  bundle: 'icon_text_list',
  propsFieldMapping: {
    paragraphs: { type: 'field', name: 'field_content' },
  },
  editor: {
    editTitle: (el) => el.querySelector('h2')?.textContent,
    getDraggableElement: (el) => el.querySelector('.paragraph-icon-text-list'),
  },
  globalOptions: ['spacing'],
})

const paragraphClassList = computed(() => {
  const classList = []

  if (options.value.spacing === 'small') {
    classList.push('py-6', 'lg:py-10')
  } else if (options.value.spacing === 'large') {
    classList.push('py-12', 'lg:py-20')
  }

  return classList
})
</script>
