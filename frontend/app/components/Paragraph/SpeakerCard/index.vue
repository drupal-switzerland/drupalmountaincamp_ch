<template>
  <article
    class="gradient-border group relative flex flex-col overflow-hidden rounded-[18px] transition-shadow hover:shadow-lg has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-primary-500 motion-reduce:transition-none"
  >
    <MediaImage
      v-if="image"
      v-bind="image"
      :image-style="imageStyle"
      :sizes="IMAGE_SIZES"
      hide-caption
    />
    <div class="flex flex-1 flex-col gap-2 p-5">
      <component
        :is="heading"
        v-if="hasText(name) || isEditing"
        v-blokkli-editable:field_name
        class="font-heading text-xl font-medium leading-snug text-primary-500"
      >
        {{ name }}
      </component>
      <!-- After the name in the DOM, so it is read after it, but placed over
           the photo. -->
      <p
        v-if="hasText(format) || isEditing"
        v-blokkli-editable:field_label
        class="text-sm font-bold uppercase tracking-wide"
        :class="
          hasPhoto
            ? 'absolute end-3 start-3 top-3 w-fit rounded-2xl bg-primary-500 px-3 py-1 text-white'
            : 'text-primary-500'
        "
      >
        {{ format }}
      </p>
      <p
        v-if="hasText(sessionTitle) || isEditing"
        class="font-heading text-lg font-medium text-primary-500"
      >
        <!-- The link's ::after covers the card, so the whole card is clickable
             while the accessible name stays the session title. -->
        <a
          v-if="href && !isEditing"
          :href="href"
          class="text-current no-underline after:absolute after:inset-0 focus-visible:outline-none group-hover:underline"
        >
          <span v-blokkli-editable:field_title>{{ sessionTitle }}</span>
          <span v-if="isExternal" class="sr-only">
            ({{ $texts('speakerCard.external', 'opens an external site') }})
          </span>
        </a>
        <span v-else v-blokkli-editable:field_title>{{ sessionTitle }}</span>
      </p>
      <p
        v-if="hasText(summary) || isEditing"
        v-blokkli-editable:field_summary
        class="line-clamp-3 text-base"
      >
        {{ summary }}
      </p>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { ParagraphSpeakerCardFragment } from '#graphql-operations'
import { SPEAKER_CARD_HEADING } from '~/composables/speakerCardHeading'
import { buildImageSizes } from '~/helpers/imageSizes'
import { hasText } from '~/helpers/text'
import { SCREENS } from '~/tailwind/screens'

const props = defineProps<{
  name?: ParagraphSpeakerCardFragment['name']
  format?: ParagraphSpeakerCardFragment['format']
  sessionTitle?: ParagraphSpeakerCardFragment['sessionTitle']
  summary?: ParagraphSpeakerCardFragment['summary']
  link?: ParagraphSpeakerCardFragment['link']
  image?: ParagraphSpeakerCardFragment['image']
}>()

defineBlokkli({
  bundle: 'speaker_card',
  editor: {
    editTitle: (el) => el.querySelector('h2, h3')?.textContent,
    mockProps: (text) => ({
      name: text || 'Speaker name',
      sessionTitle: 'Session title',
      summary: 'Short summary of the session.',
    }),
  },
})

const { $texts } = useEasyTexts()
const isEditing = import.meta.blokkliEditing

const heading = inject(
  SPEAKER_CARD_HEADING,
  computed(() => 'h3' as const),
)

// MediaImage renders the photo only when the media has a file.
const hasPhoto = computed(() => !!props.image?.image)
const href = computed(() => props.link?.uri?.path || '')
const isExternal = computed(() => /^https?:\/\//.test(href.value))

// No aspect ratio: photos are shown whole, at the shape of their source, and
// the width and height of the derivative reserve their space.
const imageStyle = defineImageStyle({
  type: 'sizes',
  sizes: {
    xs: 640,
    sm: 768,
    md: 680,
  },
})

// Image widths in the list's grid: three columns with 24px gaps from lg, two
// from sm, one below, inside the card's 3px border on each side. The
// container has 16px padding below md, 32px from md, 48px from lg, and is
// 1380px wide from xl: (1380 - 96 - 48) / 3 - 6 = 406.
const IMAGE_SIZES = buildImageSizes(
  [
    { minWidth: SCREENS.xl, width: '406px' },
    { minWidth: SCREENS.lg, width: 'calc((100vw - 144px) / 3 - 6px)' },
    { minWidth: SCREENS.md, width: 'calc((100vw - 88px) / 2 - 6px)' },
    { minWidth: SCREENS.sm, width: 'calc((100vw - 56px) / 2 - 6px)' },
  ],
  'calc(100vw - 38px)',
)
</script>
