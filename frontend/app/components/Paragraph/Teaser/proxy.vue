<template>
  <div>
    <MediaImage
      v-bind="media"
      :image-style="imageStyle"
      class="max-w-32"
      hide-caption
    />
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphTeaserFragment } from '#graphql-operations'

const props = defineProps<{
  title?: ParagraphTeaserFragment['title']
  node?: ParagraphTeaserFragment['node']
  noLinkWrap?: boolean
}>()

const media = computed(() => {
  if (props.node && props.node?.teaserImage) {
    return props.node?.teaserImage
  }
  return null
})

const imageStyle = defineImageStyle({
  type: 'single',
  aspectRatio: 4 / 3,
  width: 440,
})
</script>
