<template>
  <div class="my-12 overflow-hidden">
    <div v-if="hasTitleHeading" class="container">
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
        <LazyParagraphCarouselSlider
          :key="items.map((v) => v.uuid).join('-')"
          :slides="items"
          :eager-first-slide="isInFirstViewport"
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
import { CAROUSEL_SLIDE_HEADING } from '~/composables/carouselSlideHeading'
import { FIRST_PARAGRAPH_IN_FIRST_VIEWPORT } from '~/composables/firstViewport'
import { hasText } from '~/helpers/text'

const props = defineProps<{
  slides?: ParagraphCarouselFragment['slides']
  title?: ParagraphCarouselFragment['title']
}>()

const isEditing = import.meta.blokkliEditing
const hasTitleHeading = computed(() => hasText(props.title) || isEditing)

provide(
  CAROUSEL_SLIDE_HEADING,
  computed(() => (hasTitleHeading.value ? 'h3' : 'h2')),
)

const { index, parentType } = defineBlokkli({
  bundle: 'carousel',
  propsFieldMapping: {
    title: { type: 'editable', name: 'field_title' },
    slides: { type: 'field', name: 'field_slides' },
  },
  editor: {
    editTitle: (el) => el.querySelector('h2')?.textContent,
  },
})

// The same rule as for a text image placed on a page: the first paragraph,
// unless the node renders a hero or top image above it.
const firstParagraphInFirstViewport = inject(
  FIRST_PARAGRAPH_IN_FIRST_VIEWPORT,
  true,
)
const isInFirstViewport = computed(
  () => index.value === 0 && !parentType.value && firstParagraphInFirstViewport,
)
</script>

<style lang="postcss">
.swiper {
  @apply overflow-visible;
}
</style>
