<template>
  <figure v-if="image">
    <ImageItem
      v-bind="image"
      :image-style
      :loading="loading"
      :preload="preload"
      class="w-full overflow-hidden"
    />
    <figcaption
      v-if="!hideCaption && (caption || copyright)"
      class="mx-auto mt-2 text-sm"
    >
      <div v-if="caption" class="float-start ms-1">
        {{ caption }}
      </div>
      <div v-if="copyright" class="float-end me-1 text-gray-900/60">
        &copy; {{ copyright }}
      </div>
    </figcaption>
  </figure>
</template>

<script lang="ts" setup>
import type { DefineImageStyleConfig } from '#rokka/types'
import type { MediaImageFragment } from '#graphql-operations'
import ImageItem from '~/components/ImageItem/index.vue'

defineOptions({
  name: 'MediaImage',
})

withDefaults(
  defineProps<{
    name?: string
    mid?: number
    caption?: MediaImageFragment['caption']
    copyright?: MediaImageFragment['copyright']
    image?: MediaImageFragment['image']
    imageStyle?: DefineImageStyleConfig | string
    imgClass?: string
    hideCaption?: boolean
    preload?: boolean
    loading?: 'lazy' | 'eager'
  }>(),
  {
    name: undefined,
    mid: 0,
    caption: '',
    copyright: '',
    image: undefined,
    imageStyle: () => {
      return 'wide'
    },
    imgClass: '',
    hideCaption: false,
    preload: false,
    loading: 'lazy',
  },
)
</script>
