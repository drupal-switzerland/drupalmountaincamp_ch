<template>
  <div v-if="text" class="text-lg lg:text-xl" :class="paragraphClassList">
    <div
      v-blokkli-editable:field_text
      class="ck-content hyphens-auto lg:hyphens-none"
      :class="{
        'col-span-4 sm:col-span-6 md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3':
          !parentType,
      }"
      v-html="text"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{ text?: string }>()

const { options, parentType } = defineBlokkli({
  bundle: 'text',
  editor: {
    addBehaviour: 'no-form',
    editTitle: (el) => el.textContent,
    getDraggableElement: (el) => el.querySelector('.ck-content'),
    determineVisibleOptions: (ctx) => {
      if (!ctx.parentType) {
        return ['spacing']
      }
      return []
    },
  },
  globalOptions: ['spacing'],
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

  if (!parentType.value) {
    classList.push('grid-container')
  }

  return classList
})
</script>
