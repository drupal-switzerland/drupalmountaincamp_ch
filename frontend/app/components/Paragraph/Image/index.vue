<template>
  <div
    :class="[
      options.spacing === 'small' ? 'py-6 lg:py-10' : '',
      options.spacing === 'large' ? 'py-12 lg:py-20' : '',
      gridContainerSize,
    ]"
  >
    <div
      v-blokkli-droppable:field_image
      :class="[parentType ? layoutClassesInner : layoutClasses]"
    >
      <MediaImage v-bind="image" :image-style="imageStyle" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphImageFragment } from '#graphql-operations'

defineOptions({
  name: 'ParagraphImage',
})

defineProps<{
  image?: ParagraphImageFragment['image']
}>()

const { parentType, options } = defineBlokkli({
  bundle: 'image',
  globalOptions: ['spacing', 'imageFormat'],
  editor: {
    editTitle: (el) => {
      const img = el.querySelector('img')
      return img?.alt || img?.title
    },
    getDraggableElement: (el) => el.querySelector('figure'),
    determineVisibleOptions: (ctx) => {
      if (!ctx.parentType) {
        return ['imageFormat', 'spacing']
      }
      return ['spacing']
    },
  },
})

const bigGrid = defineImageStyle({
  type: 'sizes',
  aspectRatio: 16 / 9,
  sizes: {
    xs: 770,
    sm: 984,
    md: 1380,
    lg: 1380,
  },
})

const textGrid = defineImageStyle({
  type: 'sizes',
  aspectRatio: 16 / 9,
  sizes: {
    xs: 728,
    sm: 1000,
    md: 912,
    lg: 912,
  },
})

const textGridOriginal = defineImageStyle({
  type: 'sizes',
  sizes: {
    xs: 728,
    sm: 1000,
    md: 912,
    lg: 912,
  },
})

const smallGrid = defineImageStyle({
  type: 'sizes',
  aspectRatio: 16 / 9,
  sizes: {
    xs: 400,
    sm: 767,
  },
})

const fullWidth = defineImageStyle({
  type: 'sizes',
  aspectRatio: 16 / 9,
  sizes: {
    xs: 728,
    sm: 984,
    md: 1400,
    lg: 1920,
  },
})

/**
 * The responsive image style name to use.
 */
const imageStyle = computed(() => {
  if (options.value.imageFormat === 'big') {
    return bigGrid
  } else if (options.value.imageFormat === 'text') {
    return textGrid
  } else if (options.value.imageFormat === 'small') {
    return smallGrid
  } else if (options.value.imageFormat === 'full') {
    return textGridOriginal
  }
  return fullWidth
})

const layoutClasses = computed(() => {
  if (options.value.imageFormat === 'big') {
    return 'col-span-4 sm:col-span-6 md:col-span-8 lg:col-span-12'
  } else if (
    options.value.imageFormat === 'text' ||
    options.value.imageFormat === 'full'
  ) {
    return 'col-span-4 sm:col-span-6 md:col-start-2 md:col-span-6 lg:col-start-3 lg:col-span-8'
  } else if (options.value.imageFormat === 'small') {
    return 'col-span-4 md:col-start-2 md:col-span-5 lg:col-start-3 lg:col-span-6'
  }
  return 'w-full flex justify-center items-center'
})

const layoutClassesInner = computed(() => {
  return 'col-span-4 sm:col-span-6 lg:col-span-8'
})

const gridContainerSize = computed(() => {
  if (options.value.imageFormat !== 'full' && !parentType.value) {
    return 'grid-container'
  } else if (parentType.value) {
    return 'grid-container is-small mb-5'
  }
  return ''
})
</script>
