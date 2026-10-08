<template>
  <p
    class="m-0 flex min-h-8 flex-wrap items-center justify-center gap-x-2 border-b border-primary-100 bg-primary-50 px-outer py-1 text-center text-sm font-medium text-primary-500"
  >
    <span>{{ $texts('edition.dates', 'March 2–4, 2027') }}</span>
    <span aria-hidden="true" class="text-primary-400">·</span>
    <span>{{
      $texts('edition.venue', 'Davos Congress Centre, Switzerland')
    }}</span>
  </p>
</template>

<script lang="ts" setup>
// Rendered above the sticky header in the page flow, so it scrolls away on its
// own while the header stays.
const { $texts } = useEasyTexts()
</script>
