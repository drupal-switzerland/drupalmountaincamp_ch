<template>
  <BlokkliProvider v-slot="{ entity }" v-bind="blokkliProps" :entity="props">
    <div class="grid-container">
      <div class="grid-container-8 pb-4">
        <p v-if="date" class="font-bold text-primary-500">
          {{ date?.formatted }}
        </p>
        <h1 v-blokkli-editable:title class="pb-3 text-4xl lg:pb-6 lg:text-7xl">
          {{ entity?.title || title }}
        </h1>
        <div class="text-xl md:text-3xl" v-html="entity?.lead || lead" />
      </div>

      <div class="grid-container-6">
        <MediaImage
          v-if="image"
          v-blokkli-droppable:field_image
          v-bind="entity?.image || image"
          :image-style="imageStyle"
          class="mb-10"
        />
      </div>
    </div>
    <div>
      <BlokkliField :list="paragraphs" name="field_paragraphs" />
    </div>
  </BlokkliProvider>
</template>

<script lang="ts" setup>
import type { NodePressReleaseFragment } from '#graphql-operations'

const props = defineProps<{
  uuid?: string
  title?: string
  lead?: string
  image?: NodePressReleaseFragment['image']
  paragraphs?: NodePressReleaseFragment['paragraphs']
  date?: NodePressReleaseFragment['date']
  blokkliProps: NodePressReleaseFragment['blokkliProps']
}>()

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 4 / 3,
  sizes: {
    sm: 530,
    md: 728,
    lg: 796,
    xl: 1040,
  },
})

function mapLead(v?: string) {
  return `<span class="float-left">${props.date?.formatted} –&nbsp;</span> ${v}`
}
</script>
