<template>
  <div
    v-if="videoUrl"
    :class="[
      options.spacing === 'small' ? 'py-6 lg:py-10' : '',
      options.spacing === 'large' ? 'py-12 lg:py-20' : '',
      gridContainerSize,
      paragraphClassList,
    ]"
  >
    <div :class="[layoutClasses]">
      <VuepalRemoteVideo v-slot="{ embedUrl, thumbnailUrl }" :url="videoUrl">
        <figure class="w-full max-w-[1920px]">
          <iframe
            v-if="embedUrl && isPlaying"
            :src="embedUrl"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
            class="aspect-video w-full lg:px-0"
          />

          <button
            v-if="!isPlaying"
            class="relative flex aspect-video w-full cursor-pointer items-center justify-center lg:px-0"
            :aria-label="$texts('video.load', 'Video laden')"
            @click.prevent="isPlaying = true"
          >
            <ImageItem
              v-if="video?.thumbnailCustom"
              :image-style="imageStyle"
              loading="lazy"
              v-bind="video.thumbnailCustom"
              class="absolute left-0 top-0 w-full"
            />

            <img
              v-else-if="thumbnailUrl"
              :src="thumbnailUrl"
              class="absolute left-0 top-0 size-full object-cover"
              :alt="videoDescription"
            />

            <img
              v-else
              :src="video?.thumbnailOriginal?.entity?.uri?.first?.url"
              class="absolute left-0 top-0 size-full object-cover"
              :alt="videoDescription"
            />

            <SpriteSymbol name="play" class="z-10 size-[75px]" />
          </button>

          <figcaption
            v-if="videoDescription || source"
            class="mx-auto mt-2 max-w-[728px] justify-between text-sm md:flex md:flex-wrap md:gap-1"
          >
            <div v-if="videoDescription">
              {{ videoDescription }}
            </div>
            <div v-if="source" class="mt-2 text-gray-900/60 md:mt-0">
              &copy; {{ source }}
            </div>
          </figcaption>
        </figure>
      </VuepalRemoteVideo>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphVideoFragment } from '#graphql-operations'

const { options } = defineBlokkli({
  bundle: 'video',
  editor: {
    editTitle: (el) => el.querySelector('h2')?.innerText,
  },
  globalOptions: ['spacing'],
  options: {
    format: {
      type: 'radios',
      label: 'Bildformat',
      default: 'full',
      displayAs: 'icons',
      options: {
        full: { label: 'extra large', icon: 'bk_mdi_fullscreen' },
        big: { label: 'large', icon: 'bk_mdi_photo_size_select_large' },
        text: { label: 'medium', icon: 'bk_mdi_crop_landscape' },
        small: { label: 'small', icon: 'bk_mdi_photo_size_select_small' },
      },
    },
  },
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

const props = defineProps<{
  video?: ParagraphVideoFragment['video']
  videoDescription?: ParagraphVideoFragment['videoDescription']
  source?: ParagraphVideoFragment['source']
}>()

const { $texts } = useEasyTexts()

/**
 * The responsive image style name to use.
 */
const imageStyle = computed(() => {
  if (options.value.format === 'big') {
    return bigGrid
  } else if (options.value.format === 'text') {
    return textGrid
  } else if (options.value.format === 'small') {
    return smallGrid
  }
  return fullWidth
})

const isPlaying = ref(false)

const videoUrl = computed(() => props.video?.url)

const layoutClasses = computed(() => {
  if (options.value.format === 'big') {
    return 'col-span-4 sm:col-span-6 md:col-span-8 lg:col-span-12'
  } else if (options.value.format === 'text') {
    return 'col-span-4 sm:col-span-6 md:col-start-2 md:col-span-6 lg:col-start-3 lg:col-span-8'
  } else if (options.value.format === 'small') {
    return 'col-span-4 md:col-start-2 md:col-span-5 lg:col-start-3 lg:col-span-6'
  }
  return 'w-full flex flex-col justify-center items-center'
})

const gridContainerSize = computed(() => {
  if (options.value.format !== 'full') {
    return 'grid-container'
  }
  return ''
})
</script>
