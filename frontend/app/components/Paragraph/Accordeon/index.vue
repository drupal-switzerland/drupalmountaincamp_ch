<template>
  <div
    class="paragraph-accordeon mt-5"
    :class="{
      'grid-container': !parentType,
    }"
  >
    <Collapsible
      :details-class-list="detailsClassList"
      summary-class-list="hover:text-primary-500"
      :force-open="isEditing"
    >
      <template #summary>
        <h2 v-blokkli-editable:field_title class="text-xl lg:text-2xl">
          {{ title }}
        </h2>
        <SpriteSymbol
          name="chevron-down"
          class="h-6 w-12 text-primary-500 transition-all duration-250 [.open_&]:rotate-180"
          aria-hidden="true"
        />
      </template>

      <template #details>
        <div class="mt-6">
          <BlokkliField :list="paragraphs" name="field_content" />
        </div>
      </template>
    </Collapsible>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphAccordeonFragment } from '#graphql-operations'

defineProps<{
  title: ParagraphAccordeonFragment['title']
  paragraphs: ParagraphAccordeonFragment['paragraphs']

  /**
   * Force the accordion to be always open.
   *
   * We mostly use this in the editor, so that the contents of the accordion
   * are visible.
   */
  alwaysOpen?: boolean
}>()

const { isEditing, parentType } = defineBlokkli({
  bundle: 'accordeon',
  propsFieldMapping: {
    paragraphs: { type: 'field', name: 'field_content' },
  },
  editor: {
    editTitle: (el) => el.querySelector('h2')?.textContent,
    addBehaviour: 'no-form',
  },
})

const detailsClassList = computed<string[]>(() => {
  const classList = [
    'py-5',
    'border-b-1',
    'border-gray-300',
    'first:border-t-1',
  ]

  if (!parentType.value) {
    classList.push(
      'col-span-4',
      'sm:col-span-6',
      'md:col-start-2',
      'md:col-span-6',
      'lg:col-start-3',
      'lg:col-span-8',
    )
  }

  return classList
})
</script>

<style lang="postcss">
.paragraph-accordeon {
  + .paragraph-accordeon {
    margin-top: 0;
    details {
      border-top: 0;
    }
  }
}
</style>
