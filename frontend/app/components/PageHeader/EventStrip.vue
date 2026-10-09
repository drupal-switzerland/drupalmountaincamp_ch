<template>
  <p
    class="m-0 h-12 truncate border-b border-primary-100 bg-primary-50 px-outer py-2 text-center text-xs font-medium leading-4 text-primary-500 min-[390px]:h-10 min-[390px]:py-0 min-[390px]:leading-10 xs:text-sm xs:leading-10"
  >
    {{ $texts('edition.dates', 'March 2–4, 2027') }}
    <span
      aria-hidden="true"
      class="mx-1 hidden text-primary-400 min-[390px]:inline"
      >·</span
    >
    <br class="min-[390px]:hidden" />
    {{ $texts('edition.venue', 'Davos Congress Centre, Switzerland') }}
  </p>
</template>

<script lang="ts" setup>
// Rendered above the sticky header in the page flow, so it scrolls away on its
// own while the header stays. A fixed height at every width: if the text
// wrapped in the fallback font and not in the web font, the page would jump on
// load. Below 390px the dates and venue get a fixed line each.
const { $texts } = useEasyTexts()
</script>
