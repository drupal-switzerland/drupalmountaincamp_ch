<template>
  <p
    class="m-0 h-10 truncate border-b border-primary-100 bg-primary-50 px-outer text-center text-xs font-medium leading-10 text-primary-500 xs:text-sm xs:leading-10"
  >
    {{ $texts('edition.dates', 'March 2–4, 2027') }}
    <span aria-hidden="true" class="mx-1 text-primary-400">·</span>
    {{ $texts('edition.venue', 'Davos Congress Centre, Switzerland') }}
  </p>
</template>

<script lang="ts" setup>
// Rendered above the sticky header in the page flow, so it scrolls away on its
// own while the header stays. One line at a fixed height: if the text wrapped
// in the fallback font and not in the web font, the page would jump on load.
const { $texts } = useEasyTexts()
</script>
