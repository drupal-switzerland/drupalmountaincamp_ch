<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href || undefined"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'sponsored noopener' : undefined"
    :aria-describedby="href ? describedBy : undefined"
    class="flex items-center justify-center rounded-xl border-2 border-primary-100 bg-white px-4"
    :class="tileClass"
  >
    <template v-if="image || icon">
      <!-- The logo is decorative; the sponsor name below names the tile. -->
      <span class="block max-w-full" :style="logoStyle" aria-hidden="true">
        <img
          v-if="image"
          :src="toDrupalFilePath(image.urlPath)"
          :srcset="srcset || undefined"
          :sizes="srcset ? logoStyle.width : undefined"
          :width="renderedSize?.width"
          :height="renderedSize?.height"
          alt=""
          class="size-full object-contain"
          loading="lazy"
        />
        <MediaIcon v-else-if="icon" v-bind="icon" class="size-full" />
      </span>
      <span class="sr-only">{{ sponsor.title }}</span>
    </template>
    <span v-else class="text-center font-bold text-primary-500">
      {{ sponsor.title }}
    </span>
  </component>
</template>

<script lang="ts" setup>
import type { NodeSponsorFragment } from '#graphql-operations'
import { type LogoBox, logoSize, logoSrcset } from '~/helpers/sponsors'
import { toDrupalFilePath } from '~/helpers/drupalFiles'

const props = defineProps<{
  sponsor: NodeSponsorFragment
  box: LogoBox
  tileClass?: string
  describedBy?: string
}>()

const href = computed(() => props.sponsor.link?.uri?.path)
const media = computed(() => props.sponsor.logo?.first?.entity)

const image = computed(() => {
  const entity = media.value
  const wide = entity && 'image' in entity ? entity.image?.wide : null
  return wide?.urlPath ? wide : null
})

// The logo renders far below the wide derivative's 1090px, so the browser
// picks between the derivatives by the rendered width.
const srcset = computed(() => {
  const entity = media.value
  const file = entity && 'image' in entity ? entity.image : null
  return file ? logoSrcset([file.large, file.wide], toDrupalFilePath) : ''
})

const icon = computed(() => {
  const entity = media.value
  return entity && 'svg' in entity ? entity : null
})

const intrinsicSize = computed(() => {
  const source = image.value ?? icon.value?.svg?.first
  return source?.width && source.height
    ? { width: source.width, height: source.height }
    : null
})

// The size the logo is laid out at; also the <img>'s width and height, so the
// browser knows its ratio before the file loads.
const renderedSize = computed(() => {
  const size = intrinsicSize.value
  return size ? logoSize(size.width, size.height, props.box) : null
})

// Width plus aspect ratio (not a fixed height) so a logo can shrink with
// max-width on narrow screens without distorting.
const logoStyle = computed(() => {
  const size = intrinsicSize.value
  // Drupal stores no dimensions for SVG uploads; the SVG then scales to fit
  // the box and keeps its own aspect ratio.
  if (!size) {
    return {
      width: `${props.box.maxWidth}px`,
      height: `${props.box.maxHeight}px`,
    }
  }
  return {
    width: `${renderedSize.value?.width}px`,
    aspectRatio: `${size.width} / ${size.height}`,
  }
})
</script>
