<template>
  <div class="sm:grid sm:grid-cols-12">
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
        <div class="ck-content hyphens-auto" v-html="text" />
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

const { index, parentType } = defineBlokkli({
  bundle: 'text_image',
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
