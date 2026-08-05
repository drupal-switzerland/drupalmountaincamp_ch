<template>
  <RokkaImage
    v-if="file?.rokka?.hash"
    :alt="alt"
    :title="title"
    :hash="file.rokka.hash"
    :config="imageStyle"
    :loading="loading"
    :preload="preload"
    :source-width="file.rokka.sourceWidth"
    :source-height="file.rokka.sourceHeight"
    :class="imgClass"
    :host="appConfig.rokkaHost"
    :file-name="file?.label"
  />
  <!-- ponytail: no rokka account on this project — serve originals from Drupal. Swap back to rokka-only if an org is set up. -->
  <img
    v-else-if="localSrc"
    :src="localSrc"
    :alt="alt"
    :title="title"
    :loading="loading"
    :width="wide?.width"
    :height="wide?.height"
    class="max-w-full"
    :class="imgClass"
  />
</template>

<script lang="ts" setup>
import type { DefineImageStyleConfig } from '#rokka/types'
import type { ImageItemFragment } from '#graphql-operations'
import { RokkaImage } from '#components'

defineOptions({
  name: 'ImageItem',
})

const props = withDefaults(
  defineProps<{
    file?: ImageItemFragment['file']
    wide?: ImageItemFragment['wide']
    alt?: string
    title?: string
    imageStyle?: DefineImageStyleConfig | string
    imgClass?: string
    preload?: boolean
    loading?: 'lazy' | 'eager'
  }>(),
  {
    file: undefined,
    wide: undefined,
    alt: '',
    title: '',
    imageStyle: () => {
      return 'wide'
    },
    imgClass: '',
    preload: false,
    loading: 'lazy',
  },
)

const appConfig = useAppConfig()

const localSrc = computed(() => {
  // Prefer the Drupal image style derivative over the (potentially huge) original.
  if (props.wide?.urlPath) {
    return props.wide.urlPath
  }
  const uri = props.file?.uri
  if (!uri) {
    return ''
  }
  if (uri.startsWith('public://')) {
    return uri.replace('public://', '/sites/default/files/')
  }
  if (uri.startsWith('http')) {
    return uri
  }
  return ''
})
</script>
