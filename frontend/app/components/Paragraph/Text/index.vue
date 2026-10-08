<template>
  <div v-if="text" :class="bandClassList">
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
        return ['spacing', 'background', 'alignment']
      }
      return []
    },
  },
  globalOptions: ['spacing'],
  options: {
    background: {
      type: 'radios',
      label: 'Background',
      default: 'none',
      options: {
        none: 'None',
        light: 'Light card',
        theme: 'Theme band',
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

// Options only apply to top-level paragraphs; nested ones keep the plain look.
const background = computed(() =>
  isTopLevel.value ? options.value.background : 'none',
)
const alignment = computed(() =>
  isTopLevel.value ? options.value.alignment : 'left',
)

useScrollableTables(content, {
  breakout: () =>
    isTopLevel.value && ['none', 'navy'].includes(background.value),
  enabled: !import.meta.blokkliEditing,
  content: () => props.text,
})

const bandClassList = computed(() =>
  background.value === 'navy'
    ? ['on-dark', 'brand-hero', 'text-white', 'pb-8']
    : [],
)

const columnClassList = computed(() => {
  if (!isTopLevel.value) {
    return []
  }

  const classList = [
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
