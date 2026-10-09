<template>
  <li v-if="display === 'timeline'" class="week-stop">
    <span class="week-stop-node" aria-hidden="true">{{ stopNumber }}</span>
    <p class="label">{{ dayLabel }}</p>
    <h3
      v-if="title || isEditing"
      v-blokkli-editable:field_title
      class="text-2xl"
    >
      {{ title }}
    </h3>
    <!-- A second "Label" paragraph in the text starts a lane, e.g. Social. -->
    <div
      v-if="text || isEditing"
      ref="content"
      v-blokkli-editable:field_text
      class="ck-content is-small week-stop-text"
      v-html="text"
    />
  </li>

  <article
    v-else-if="display === 'dayCards'"
    class="day-card gradient-border relative flex flex-col overflow-hidden rounded-[18px]"
  >
    <div
      class="brand-card-header on-dark flex flex-col gap-2 px-6 py-5 text-white"
    >
      <p class="label">{{ dayLabel }}</p>
      <h3
        v-if="title || isEditing"
        v-blokkli-editable:field_title
        class="text-2xl"
      >
        {{ title }}
      </h3>
    </div>
    <div
      v-if="text || isEditing"
      ref="content"
      v-blokkli-editable:field_text
      class="ck-content hyphens-auto px-6 pb-6 pt-5 lg:hyphens-none"
      v-html="text"
    />
  </article>

  <article
    v-else-if="display === 'infoCards'"
    class="gradient-border flex flex-col overflow-hidden rounded-[18px]"
  >
    <!-- Optional photo across the top of the card. -->
    <div v-if="image || isEditing" v-blokkli-droppable:field_image>
      <MediaImage
        v-if="image"
        v-bind="image"
        :image-style="cardImageStyle"
        hide-caption
      />
    </div>
    <div class="flex grow flex-col gap-3 p-6 md:p-8">
      <h3
        v-if="title || isEditing"
        v-blokkli-editable:field_title
        class="text-2xl"
      >
        {{ title }}
      </h3>
      <div
        v-if="text || isEditing"
        ref="content"
        v-blokkli-editable:field_text
        class="ck-content hyphens-auto lg:hyphens-none"
        v-html="text"
      />
      <p v-if="image?.copyright" class="mt-auto text-sm text-gray-600">
        &copy; {{ image.copyright }}
      </p>
    </div>
  </article>

  <div
    v-else
    class="col-span-4 flex flex-col items-center gap-4 border-b pb-8 sm:col-span-6 sm:flex-row sm:items-start sm:py-8 md:col-span-4 lg:col-span-6"
  >
    <div v-blokkli-droppable:field_icon class="sm:w-[207px]">
      <MediaIcon
        v-if="icon"
        v-bind="icon"
        class="mx-10 mt-10 size-[50px] fill-primary-500 lg:mx-0 lg:mt-0 lg:size-[100px]"
      />
    </div>
    <div class="grid">
      <h3
        v-if="title || isEditing"
        v-blokkli-editable:field_title
        class="col-span-7 mb-2 text-3xl"
      >
        {{ title }}
      </h3>
      <div
        v-if="text || isEditing"
        ref="content"
        v-blokkli-editable:field_text
        class="ck-content col-span-7 hyphens-auto lg:hyphens-none"
        v-html="text"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphIconTextItemFragment } from '#graphql-operations'
import { dayNumber } from '~/helpers/programme'

const props = defineProps<{
  icon: ParagraphIconTextItemFragment['icon']
  image?: ParagraphIconTextItemFragment['image']
  text: ParagraphIconTextItemFragment['text']
  title: ParagraphIconTextItemFragment['title']
}>()

const { index } = defineBlokkli({
  bundle: 'icon_text_item',
})

const { $texts } = useEasyTexts()
const isEditing = import.meta.blokkliEditing

const display = inject(
  ICON_TEXT_LIST_DISPLAY,
  computed<IconTextListDisplay>(() => 'list'),
)

// Info cards sit two to a row, so the photo never needs more than half the grid.
const cardImageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 3 / 2,
  sizes: {
    xs: 640,
    sm: 768,
    md: 680,
  },
})

const stopNumber = computed(() => dayNumber(props.title, index.value))

const dayLabel = computed(
  () => `${$texts('iconText.day', 'Day')} ${index.value + 1}`,
)

const content = ref<HTMLElement | null>(null)

useScrollableTables(content, {
  breakout: false,
  enabled: !import.meta.blokkliEditing,
  content: () => props.text,
})
</script>
