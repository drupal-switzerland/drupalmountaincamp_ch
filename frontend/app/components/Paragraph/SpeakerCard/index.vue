<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-[18px] transition-shadow hover:shadow-lg has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-primary-500 motion-reduce:transition-none"
    :class="
      isKeynote
        ? 'speaker-card-keynote on-dark text-white sm:col-span-2'
        : 'gradient-border'
    "
  >
    <MediaImage
      v-if="image"
      v-bind="image"
      :image-style="imageStyle"
      :sizes="isKeynote ? KEYNOTE_IMAGE_SIZES : FEATURED_IMAGE_SIZES"
      hide-caption
    />
    <div
      class="flex flex-col"
      :class="isKeynote ? 'gap-3 p-6 lg:gap-4 lg:p-9' : 'gap-2 p-5'"
    >
      <p v-if="isKeynote" class="label">
        {{ $texts('speakerCard.keynote', 'Keynote') }}
      </p>
      <component
        :is="heading"
        v-if="hasText(name) || isEditing"
        v-blokkli-editable:field_name
        class="font-heading font-medium"
        :class="
          isKeynote
            ? 'text-4xl text-white lg:text-6xl'
            : 'text-xl leading-snug text-primary-500'
        "
      >
        {{ name }}
      </component>
      <p
        v-if="hasText(sessionTitle) || isEditing"
        class="font-heading font-medium"
        :class="
          isKeynote
            ? 'text-xl text-primary-100 lg:text-2xl'
            : 'text-lg text-primary-500'
        "
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
import {
  SPEAKER_CARD_HEADING,
  SPEAKER_LIST_VARIANT,
} from '~/composables/speakerListVariant'
import { buildImageSizes } from '~/helpers/imageSizes'
import { hasText } from '~/helpers/text'
import { SCREENS } from '~/tailwind/screens'

const props = defineProps<{
  name?: ParagraphSpeakerCardFragment['name']
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

const variant = inject(
  SPEAKER_LIST_VARIANT,
  computed(() => 'featured' as const),
)
const isKeynote = computed(() => variant.value === 'keynote')
const heading = inject(
  SPEAKER_CARD_HEADING,
  computed(() => 'h3' as const),
)

const href = computed(() => props.link?.uri?.path || '')
const isExternal = computed(() => /^https?:\/\//.test(href.value))

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 3 / 2,
  sizes: {
    xs: 640,
    sm: 768,
    md: 680,
  },
})

// Image widths in the list's grid: four columns with 24px gaps from md, two
// from sm, one below. The container has 16px padding below md, 32px from md,
// 48px from lg, and is 1380px wide from xl. Featured cards sit inside a 3px
// border on each side; keynote cards span two columns and have no border.
const FEATURED_IMAGE_SIZES = buildImageSizes(
  [
    { minWidth: SCREENS.xl, width: '297px' },
    { minWidth: SCREENS.lg, width: 'calc((100vw - 168px) / 4 - 6px)' },
    { minWidth: SCREENS.md, width: 'calc((100vw - 136px) / 4 - 6px)' },
    { minWidth: SCREENS.sm, width: 'calc((100vw - 56px) / 2 - 6px)' },
  ],
  'calc(100vw - 38px)',
)
const KEYNOTE_IMAGE_SIZES = buildImageSizes(
  [
    { minWidth: SCREENS.xl, width: '630px' },
    { minWidth: SCREENS.lg, width: 'calc((100vw - 168px) / 2 + 24px)' },
    { minWidth: SCREENS.md, width: 'calc((100vw - 136px) / 2 + 24px)' },
  ],
  'calc(100vw - 32px)',
)
</script>

<style lang="postcss">
.speaker-card-keynote {
  background: linear-gradient(
    160deg,
    theme(colors.brand.navy) 55%,
    theme(colors.brand.blue)
  );
}
</style>
