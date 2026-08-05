<template>
  <BlokkliProvider v-slot="{ entity }" v-bind="blokkliProps" :entity="props">
    <div class="mt-[-88px]">
      <div class="gradient-overlay relative my-8 max-h-screen overflow-hidden">
        <MediaImage
          v-if="hero"
          v-blokkli-droppable:field_hero_image
          preload
          :loading="'eager'"
          hide-caption
          v-bind="entity?.hero || hero"
          :image-style="bigGrid"
          class="w-full"
        />
        <Container class="my-0">
          <div class="grid-container absolute bottom-6 my-0 md:bottom-12">
            <h1
              v-blokkli-editable:title
              class="col-span-4 text-4xl text-white sm:col-span-6 md:col-span-6 md:text-5xl lg:col-span-8 lg:text-7xl xl:text-8xl"
            >
              {{ entity?.title || title }}
            </h1>
          </div>
        </Container>
      </div>
      <div v-if="lead" class="grid-container">
        <div
          class="col-span-4 pb-10 sm:col-span-6 md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3"
        >
          <div
            v-blokkli-editable:field_lead
            class="text-xl md:text-2xl"
            v-html="lead"
          />
        </div>
      </div>
      <div>
        <BlokkliField :list="paragraphs" name="field_paragraphs" />
      </div>
    </div>
  </BlokkliProvider>
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

const props = defineProps<{
  uuid: string
  title?: string
  lead?: string
  hero?: NodePageFragment['hero']
  paragraphs?: NodePageFragment['paragraphs']
  body?: string
  blokkliProps: NodePageFragment['blokkliProps']
}>()

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
</script>
