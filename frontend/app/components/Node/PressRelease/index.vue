<template>
  <BlokkliProvider v-slot="{ entity }" v-bind="blokkliProps" :entity="props">
    <div class="grid-container">
      <div class="grid-container-8 pb-4">
        <p v-if="date" class="font-bold text-primary-500">
          <time v-if="date.value" :datetime="date.value">
            {{ date.formatted }}
          </time>
          <template v-else>{{ date.formatted }}</template>
        </p>
        <h1
          v-blokkli-editable:title
          class="pb-3 text-4xl leading-none [text-wrap:balance] lg:pb-6 lg:text-7xl"
        >
          {{ entity?.title || title }}
        </h1>
        <div class="text-xl md:text-3xl" v-html="entity?.lead || lead" />
      </div>

      <div class="grid-container-6">
        <!-- Rendered while editing, so an empty field has a drop target. -->
        <div
          v-if="entity?.image || image || isEditing"
          v-blokkli-droppable:field_image
        >
          <MediaImage
            v-if="entity?.image || image"
            v-bind="entity?.image || image"
            :image-style="imageStyle"
            preload
            :loading="'eager'"
            class="mb-10"
          />
        </div>
      </div>
    </div>
    <div>
      <BlokkliField :list="paragraphs" name="field_paragraphs" />
    </div>
  </BlokkliProvider>
</template>

<script lang="ts" setup>
import type { NodePressReleaseFragment } from '#graphql-operations'
import { IMAGE_CREDIT_BELOW_IMAGE } from '~/composables/imageCreditDisplay'
import { FIRST_PARAGRAPH_IN_FIRST_VIEWPORT } from '~/composables/firstViewport'

const isEditing = import.meta.blokkliEditing

const props = defineProps<{
  uuid?: string
  title?: string
  lead?: string
  image?: NodePressReleaseFragment['image']
  paragraphs?: NodePressReleaseFragment['paragraphs']
  date?: NodePressReleaseFragment['date']
  blokkliProps: NodePressReleaseFragment['blokkliProps']
}>()

provide(IMAGE_CREDIT_BELOW_IMAGE, true)
// The article image is the first viewport's image when there is one.
provide(FIRST_PARAGRAPH_IN_FIRST_VIEWPORT, !props.image)

const imageStyle = defineImageStyle({
  type: 'sizes',
  sizes: {
    sm: 530,
    md: 728,
    lg: 796,
    xl: 1040,
  },
})
</script>
