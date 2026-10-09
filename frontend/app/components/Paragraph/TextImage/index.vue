<template>
  <div v-if="isTopLevel" class="container" :class="spacingClassList">
    <div class="grid gap-8 md:grid-cols-2 md:items-start lg:gap-16">
      <div class="min-w-0">
        <h2
          v-if="title || isEditing"
          v-blokkli-editable:field_title
          class="mb-4 text-3xl lg:text-4xl"
        >
          {{ title }}
        </h2>
        <div
          v-if="text || isEditing"
          ref="content"
          v-blokkli-editable:field_text
          class="ck-content hyphens-auto"
          v-html="text"
        />
      </div>
      <div
        v-blokkli-droppable:field_image
        class="min-w-0"
        :class="{ 'md:order-first': options.imagePosition === 'left' }"
      >
        <MediaImage
          v-if="image"
          v-bind="image"
          :image-style="pageImageStyle"
          :loading="loading"
          :preload="preload"
          class="overflow-hidden rounded-[18px]"
        />
      </div>
    </div>
  </div>
  <div v-else class="sm:grid sm:grid-cols-12">
    <div class="col-span-7">
      <div class="swiper-carousel-left relative z-50 origin-bottom-left">
        <ImageItem
          data-swiper-parallax-scale="0.66666666"
          :image-style="imageStyle"
          v-bind="image?.image"
          :loading="loading"
          :preload="preload"
        />
        <div
          v-if="copyright"
          class="absolute left-0 top-full w-full pt-1 text-right text-xs text-gray-500"
        >
          &copy; {{ copyright }}
        </div>
      </div>
    </div>
    <div
      class="2xl:pl-10 col-start-8 col-end-[-1] mt-7 sm:mt-0 sm:pl-6 lg:mt-6 xl:pl-9"
    >
      <div class="swiper-carousel-content">
        <h2 class="mb-4 text-2xl md:text-4xl">
          {{ title }}
        </h2>
        <div ref="content" class="ck-content hyphens-auto" v-html="text" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphTextImageFragment } from '#graphql-operations'

const props = defineProps<{
  title?: string
  text?: string
  image: ParagraphTextImageFragment['image']
}>()

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 4 / 3,
  sizes: {
    xs: 440,
    sm: 768,
    md: 800,
  },
})

// On a page: text beside the image, image left or right by option. Inside a
// carousel the paragraph keeps its slide layout.
const pageImageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 3 / 2,
  sizes: {
    xs: 640,
    sm: 768,
    md: 680,
  },
})

const { index, parentType, options } = defineBlokkli({
  bundle: 'text_image',
  globalOptions: ['spacing'],
  options: {
    imagePosition: {
      type: 'radios',
      label: 'Image position',
      default: 'right',
      options: {
        left: 'Image left',
        right: 'Image right',
      },
    },
  },
  editor: {
    // Position and spacing only apply on a page, not inside a carousel.
    determineVisibleOptions: (ctx) =>
      ctx.parentType ? [] : ['imagePosition', 'spacing'],
  },
})

const isEditing = import.meta.blokkliEditing
const isTopLevel = computed(() => !parentType.value)

const spacingClassList = computed(() => {
  if (options.value.spacing === 'small') {
    return ['py-6', 'lg:py-10']
  }
  if (options.value.spacing === 'large') {
    return ['py-12', 'lg:py-20']
  }
  return []
})

const content = ref<HTMLElement | null>(null)

useScrollableTables(content, {
  breakout: false,
  enabled: !import.meta.blokkliEditing,
  content: () => props.text,
})

const preload = computed(() => index.value === 0 && !parentType.value)

// If the index is 0, the image is most probably above the fold
const loading = computed(() => (preload.value ? 'eager' : 'lazy'))

const copyright = computed(() => {
  return props.image?.copyright || ''
})
</script>

<style lang="postcss">
.swiper-carousel-content {
  transition: var(--swiper-transition-duration) cubic-bezier(0.37, 0, 0.63, 1);
}

.swiper-carousel-left {
  transition: var(--swiper-transition-duration) cubic-bezier(0.37, 0, 0.63, 1);
}
</style>
