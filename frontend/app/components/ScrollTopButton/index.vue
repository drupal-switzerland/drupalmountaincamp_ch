<template>
  <button
    class="group sticky bottom-2 left-full z-[9999] -mb-2 mr-2 inline-flex cursor-pointer items-center"
    aria-label="Scroll to top"
    @click="scrollToTop"
  >
    <span
      class="flex size-8 items-center justify-center overflow-hidden rounded border-2 bg-gray-100 transition group-hover:bg-gray-300"
    >
      <span class="relative block size-8">
        <SpriteSymbol
          name="arrow-right"
          class="absolute left-0 top-0 size-full -rotate-90 transition group-hover:text-primary-300"
        />
      </span>
    </span>
  </button>
</template>

<script lang="ts" setup>
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
</script>
