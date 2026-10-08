<template>
  <div class="grid-container" :class="paragraphClassList">
    <div class="col-span-4 sm:col-span-6 md:col-span-8 lg:col-span-12">
      <h2
        v-if="title || isEditing"
        v-blokkli-editable:field_title
        class="mb-5 text-3xl lg:text-4xl"
      >
        {{ title }}
      </h2>
      <div
        v-if="text || isEditing"
        ref="content"
        v-blokkli-editable:field_text
        class="ck-content hyphens-auto lg:hyphens-none"
        v-html="text"
      />
      <BlokkliField
        :list="paragraphs"
        name="field_content"
        :class="fieldClassList"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphIconTextListFragment } from '#graphql-operations'

const props = defineProps<{
  text: ParagraphIconTextListFragment['text']
  title: ParagraphIconTextListFragment['title']
  paragraphs: ParagraphIconTextListFragment['paragraphs']
}>()

const isEditing = import.meta.blokkliEditing
const { options } = defineBlokkli({
  bundle: 'icon_text_list',
  propsFieldMapping: {
    title: { type: 'editable', name: 'field_title' },
    text: { type: 'editable', name: 'field_text' },
    paragraphs: { type: 'field', name: 'field_content' },
  },
  editor: {
    editTitle: (el) => el.querySelector('h2')?.textContent,
    getDraggableElement: (el) => el.querySelector('.paragraph-icon-text-list'),
  },
  globalOptions: ['spacing'],
  options: {
    display: {
      type: 'radios',
      label: 'Display',
      default: 'list',
      options: {
        list: 'List',
        dayCards: 'Day cards',
        infoCards: 'Info cards',
      },
    },
  },
})

const display = computed(() => options.value.display as IconTextListDisplay)
provide(ICON_TEXT_LIST_DISPLAY, display)

const fieldClassList = computed(() => {
  if (display.value === 'dayCards') {
    return ['grid', 'gap-5', 'py-8', 'md:grid-cols-3']
  }
  if (display.value === 'infoCards') {
    return ['grid', 'gap-5', 'py-8', 'md:grid-cols-2']
  }
  return ['grid-container', 'py-20']
})

const content = ref<HTMLElement | null>(null)

useScrollableTables(content, {
  breakout: false,
  enabled: !import.meta.blokkliEditing,
  content: () => props.text,
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
