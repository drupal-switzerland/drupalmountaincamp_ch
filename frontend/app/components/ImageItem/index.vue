<template>
  <RokkaImage
    v-if="file?.rokka?.hash && useRokka"
    :alt="alt"
    :title="title"
    :hash="file.rokka.hash"
    :config="imageStyle"
    :loading="loading"
    :preload="preload"
    :source-width="file.rokka.sourceWidth"
    :source-height="file.rokka.sourceHeight"
    :class="imgClass"
    :file-name="file?.label"
  />
  <img
    v-else-if="localSrc"
    :src="localSrc"
    :srcset="srcset || undefined"
    :sizes="srcset ? sizes : undefined"
    :alt="alt"
    :title="title"
    :loading="loading"
    :fetchpriority="preload ? 'high' : undefined"
    :width="wide?.width"
    :height="wide?.height"
    :style="aspectStyle"
    class="max-w-full"
    :class="imgClass"
  />
</template>

<script lang="ts" setup>
import type { DefineImageStyleConfig } from '#rokka/types'
import type { ImageItemFragment } from '#graphql-operations'
import { RokkaImage } from '#components'
import { canRenderWithRokka } from '~/helpers/rokka'
import { toDrupalFilePath } from '~/helpers/drupalFiles'
import { fallbackImageSizes } from '~/helpers/imageSizes'

defineOptions({
  name: 'ImageItem',
})

const props = withDefaults(
  defineProps<{
    file?: ImageItemFragment['file']
    large?: ImageItemFragment['large']
    mediumLarge?: ImageItemFragment['mediumLarge']
    mediumWide?: ImageItemFragment['mediumWide']
    wide?: ImageItemFragment['wide']
    extraWide?: ImageItemFragment['extraWide']
    alt?: string
    title?: string
    imageStyle?: DefineImageStyleConfig | string
    imgClass?: string
    preload?: boolean
    loading?: 'lazy' | 'eager'
    // The rendered widths, when the component knows its layout. Only used for
    // Drupal derivatives; rokka builds its own from the image style.
    sizes?: string
  }>(),
  {
    file: undefined,
    large: undefined,
    mediumLarge: undefined,
    mediumWide: undefined,
    wide: undefined,
    extraWide: undefined,
    alt: '',
    title: '',
    imageStyle: () => {
      return 'wide'
    },
    imgClass: '',
    preload: false,
    loading: 'lazy',
    sizes: undefined,
  },
)

const rokkaHost = useRuntimeConfig().public.rokkaHost

const useRokka = computed(() =>
  canRenderWithRokka(props.file?.rokka?.hash, rokkaHost),
)

const styleConfig = computed(() =>
  typeof props.imageStyle === 'object' ? props.imageStyle : undefined,
)

const srcset = computed(() => {
  const seen = new Set<number>()
  return [
    props.large,
    props.mediumLarge,
    props.mediumWide,
    props.wide,
    props.extraWide,
  ]
    .filter(
      (d): d is NonNullable<typeof d> =>
        !!d?.urlPath && !!d.width && !seen.has(d.width) && !!seen.add(d.width),
    )
    .map((d) => `${toDrupalFilePath(d.urlPath)} ${d.width}w`)
    .join(', ')
})

function configuredWidths(conf: DefineImageStyleConfig | undefined): number[] {
  if (conf?.type === 'sizes') {
    return Object.values(conf.sizes)
  }
  if (conf?.type === 'single') {
    return [conf.width]
  }
  return []
}

const sizes = computed(
  () => props.sizes ?? fallbackImageSizes(configuredWidths(styleConfig.value)),
)

const aspectStyle = computed(() => {
  // rokka would crop to the configured aspect ratio server-side; emulate it
  // with CSS so e.g. the 16/9 hero fills its box instead of letterboxing.
  const ratio = styleConfig.value?.aspectRatio
  return ratio
    ? { aspectRatio: String(ratio), objectFit: 'cover' as const }
    : undefined
})

const localSrc = computed(() => {
  // Prefer the Drupal image style derivative over the (potentially huge) original.
  if (props.wide?.urlPath) {
    return toDrupalFilePath(props.wide.urlPath)
  }
  const uri = props.file?.uri
  if (!uri) {
    return ''
  }
  if (uri.startsWith('public://')) {
    return uri.replace('public://', '/sites/default/files/')
  }
  if (uri.startsWith('http')) {
    return toDrupalFilePath(uri)
  }
  return ''
})
</script>
