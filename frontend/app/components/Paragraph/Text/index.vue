<template>
  <div v-if="hasContent || isEditing" :class="bandClassList">
    <div v-if="background === 'navy'" class="brand-strip" aria-hidden="true" />
    <div class="text-lg lg:text-xl" :class="paragraphClassList">
      <div :class="columnClassList">
        <div
          ref="content"
          v-blokkli-editable:field_text
          class="ck-content hyphens-auto lg:hyphens-none"
          :class="{ 'text-center': alignment === 'center' }"
          v-html="text"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ text?: string }>()

const content = ref<HTMLElement | null>(null)

const { options, parentType } = defineBlokkli({
  bundle: 'text',
  editor: {
    addBehaviour: 'no-form',
    editTitle: (el) => el.textContent,
    getDraggableElement: (el) => el.querySelector('.ck-content'),
    determineVisibleOptions: (ctx) => {
      if (!ctx.parentType) {
        return ['spacing', 'width', 'background', 'alignment']
      }
      return []
    },
  },
  globalOptions: ['spacing'],
  options: {
    width: {
      type: 'radios',
      label: 'Width',
      default: 'text',
      options: {
        text: 'Text column',
        wide: 'Wide',
      },
    },
    background: {
      type: 'radios',
      label: 'Background',
      default: 'none',
      options: {
        none: 'None',
        light: 'Light card',
        theme: 'Theme card',
        themeBand: 'Theme band, full width',
        navy: 'Navy band',
      },
    },
    alignment: {
      type: 'radios',
      label: 'Alignment',
      default: 'left',
      options: {
        left: 'Left',
        center: 'Center',
      },
    },
  },
})

const isTopLevel = computed(() => !parentType.value)
const isEditing = import.meta.blokkliEditing

// Media counts as content; otherwise only visible text does, so an empty
// paragraph can't leave a blank band on the page.
const hasContent = computed(() => {
  const text = props.text ?? ''
  if (/<(img|table|iframe|video|figure)\b/i.test(text)) {
    return true
  }
  const visibleText = text
    .split('<')
    .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('>') + 1)))
    .join('')
    .replaceAll('&nbsp;', ' ')
  return visibleText.trim().length > 0
})

// Options only apply to top-level paragraphs; nested ones keep the plain look.
const background = computed(() =>
  isTopLevel.value ? options.value.background : 'none',
)
const alignment = computed(() =>
  isTopLevel.value ? options.value.alignment : 'left',
)

useScrollableTables(content, {
  breakout: () =>
    isTopLevel.value &&
    ['none', 'navy', 'themeBand'].includes(background.value),
  enabled: !import.meta.blokkliEditing,
  content: () => props.text,
})

const bandClassList = computed(() => {
  if (background.value === 'navy') {
    return ['navy-band', 'on-dark', 'brand-hero', 'text-white', 'pb-8']
  }
  if (background.value === 'themeBand') {
    return ['theme-band', 'py-10', 'lg:py-20']
  }
  return []
})

const columnClassList = computed(() => {
  if (!isTopLevel.value) {
    return []
  }

  // "Wide" spans the full grid, aligned with Icon Text Lists and Teaser Lists.
  const classList =
    options.value.width === 'wide'
      ? ['col-span-4', 'sm:col-span-6', 'md:col-span-8', 'lg:col-span-12']
      : [
          'col-span-4',
          'sm:col-span-6',
          'md:col-span-6',
          'md:col-start-2',
          'lg:col-span-8',
          'lg:col-start-3',
        ]

  if (background.value === 'light') {
    classList.push('gradient-border', 'is-tint', 'rounded-[18px]', 'p-6')
  } else if (background.value === 'theme') {
    classList.push('gradient-border', 'is-theme', 'rounded-[18px]', 'p-6')
  }

  return classList
})

const paragraphClassList = computed(() => {
  if (parentType.value === 'carousel') {
    return []
  }

  if (parentType.value === 'accordeon') {
    return ['mb-5']
  }

  const classList = []

  if (options.value.spacing === 'small') {
    classList.push('py-6', 'lg:py-10')
  } else if (options.value.spacing === 'large') {
    classList.push('py-12', 'lg:py-20')
  }

  if (isTopLevel.value) {
    classList.push('grid-container')
  }

  return classList
})
</script>
