<template>
  <div class="my-12 overflow-hidden">
    <div class="container">
      <h2
        v-blokkli-editable:field_title
        class="mb-10 text-3xl md:text-4xl lg:mb-14"
      >
        {{ title }}
      </h2>
    </div>
    <div class="relative">
      <BlokkliField
        v-slot="{ items }"
        name="field_slides"
        :list="slides"
        proxy-mode
      >
        <ParagraphCarouselSlider
          :key="items.map((v) => v.uuid).join('-')"
          :slides="items"
          :class="{
            'pointer-events-none': isEditing,
          }"
        />
      </BlokkliField>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphCarouselFragment } from '#graphql-operations'

defineProps<{
  slides: ParagraphCarouselFragment['slides']
  title: ParagraphCarouselFragment['title']
}>()

const { isEditing } = defineBlokkli({
  bundle: 'carousel',
  propsFieldMapping: {
    slides: { type: 'field', name: 'field_slides' },
  },
  editor: {
    editTitle: (el) => el.querySelector('h2')?.textContent,
  },
})
</script>

<style lang="postcss">
.swiper {
  @apply overflow-visible;
}
</style>
