<template>
  <div :class="{ 'grid-container': !parentType }">
    <div
      class="my-5 last:mb-0"
      :class="{
        'col-span-4 last:mb-5 sm:col-span-6 md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3':
          !parentType,
      }"
    >
      <VuepalLink :to="link?.uri?.path" :class="buttonClassList">
        {{ label }}

        <SpriteSymbol name="arrow-right" class="size-6" />
      </VuepalLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphButtonFragment } from '#graphql-operations'

defineProps<{
  label: ParagraphButtonFragment['label']
  link: ParagraphButtonFragment['link']
}>()

const { options, parentType } = defineBlokkli({
  bundle: 'button',
  editor: {
    editTitle: (el) => el.textContent,
  },
  options: {
    buttonType: {
      type: 'radios',
      label: 'Button Type',
      default: 'standard',
      options: {
        standard: 'Default',
        filled: 'Filled',
        textOnly: 'Text only',
      },
    },
  },
})

const buttonClassList = computed(() => {
  const classList = ['button']

  if (options.value.buttonType === 'filled') {
    classList.push('is-filled')
  }

  if (options.value.buttonType === 'textOnly') {
    classList.push('is-text-only')
  }

  return classList
})
</script>
