<template>
  <div class="my-20 sm:my-[100px]">
    <div class="grid-container">
      <div
        class="col-span-4 sm:col-span-6 md:col-span-8 lg:col-span-10 lg:col-start-2"
      >
        <div
          class="flex flex-col gap-4"
          :class="{
            'sm:flex-row': options.alignment === 'left',
            'sm:flex-row-reverse': options.alignment === 'right',
          }"
        >
          <div class="basis-full sm:basis-1/4">
            <div
              v-if="image"
              class="mx-auto size-[207px] overflow-hidden sm:me-0"
              :class="{
                'sm:me-0': options.alignment === 'left',
                'sm:ms-0': options.alignment === 'right',
              }"
            >
              <ImageItem
                v-bind="image.image"
                :image-style="imageStyle"
                loading="lazy"
              />
            </div>
            <div
              v-if="copyright"
              class="w-full pt-2 text-right text-xs text-gray-500"
            >
              &copy; {{ copyright }}
            </div>
          </div>
          <div class="col-span-4 sm:col-span-8 sm:col-start-3">
            <figure
              class="flex flex-col text-left"
              :class="`sm:text-${options.alignment}`"
            >
              <blockquote>
                <span
                  v-blokkli-editable:field_quote
                  class="mb-20 text-3xl before:text-3xl before:content-['«'] after:content-['»'] md:mb-0"
                  >{{ quote }}</span
                >
              </blockquote>
              <figcaption class="mt-8 text-lg">
                <p v-blokkli-editable:field_name>
                  {{ name }}
                </p>
                <p v-blokkli-editable:field_company>
                  {{ company }}
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphQuoteFragment } from '#graphql-operations'

const props = defineProps<{
  quote?: ParagraphQuoteFragment['quote']
  name?: ParagraphQuoteFragment['name']
  company?: ParagraphQuoteFragment['company']
  image?: ParagraphQuoteFragment['image']
}>()

const copyright = computed(() => {
  return props.image?.copyright ?? ''
})

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 1,
  sizes: {
    sm: 207,
  },
})

const { options } = defineBlokkli({
  bundle: 'quote',
  editor: {
    previewWidth: 600,
    editTitle: (el) => el.querySelector('figcaption')?.textContent,
    addBehaviour: 'no-form',
  },
  options: {
    alignment: {
      type: 'radios',
      label: 'Alignment',
      default: 'left',
      displayAs: 'icons',
      options: {
        left: { label: 'left', icon: 'bk_mdi_format_align_left' },
        right: { label: 'right', icon: 'bk_mdi_format_align_right' },
      },
    },
  },
})
</script>
