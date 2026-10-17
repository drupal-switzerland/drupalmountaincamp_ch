<template>
  <section
    class="container"
    :class="paragraphClassList"
    :aria-labelledby="hasText(title) ? headingId : undefined"
  >
    <h2
      v-if="hasTitleHeading"
      :id="headingId"
      v-blokkli-editable:field_title
      class="mb-8 text-3xl lg:mb-10 lg:text-5xl"
    >
      {{ title }}
    </h2>
    <BlokkliField
      :list="paragraphs"
      name="field_content"
      class="grid gap-6 sm:grid-cols-2 md:grid-cols-4"
    />
  </section>
</template>

<script lang="ts" setup>
import type { ParagraphSpeakerListFragment } from '#graphql-operations'
import {
  SPEAKER_CARD_HEADING,
  SPEAKER_LIST_VARIANT,
  type SpeakerListVariant,
} from '~/composables/speakerListVariant'
import { hasText } from '~/helpers/text'

const props = defineProps<{
  title?: ParagraphSpeakerListFragment['title']
  paragraphs?: ParagraphSpeakerListFragment['paragraphs']
}>()

const isEditing = import.meta.blokkliEditing
const headingId = useId()
const hasTitleHeading = computed(() => hasText(props.title) || isEditing)

// Cards are one level below the block title, or take its place without one.
provide(
  SPEAKER_CARD_HEADING,
  computed(() => (hasTitleHeading.value ? 'h3' : 'h2')),
)

const { options } = defineBlokkli({
  bundle: 'speaker_list',
  propsFieldMapping: {
    title: { type: 'editable', name: 'field_title' },
    paragraphs: { type: 'field', name: 'field_content' },
  },
  editor: {
    editTitle: (el) => el.querySelector('h2')?.textContent,
  },
  globalOptions: ['spacing'],
  options: {
    variant: {
      type: 'radios',
      label: 'Speakers',
      default: 'featured',
      options: {
        keynote: 'Keynote',
        featured: 'Featured',
      },
    },
  },
})

const variant = computed(() => options.value.variant as SpeakerListVariant)
provide(SPEAKER_LIST_VARIANT, variant)

const paragraphClassList = computed(() => {
  if (options.value.spacing === 'small') {
    return ['py-6', 'lg:py-10']
  }
  if (options.value.spacing === 'large') {
    return ['py-12', 'lg:py-20']
  }
  return []
})
</script>
