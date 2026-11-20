<template>
  <section
    :aria-labelledby="headingId"
    class="gradient-border mx-auto flex max-w-[800px] flex-col items-center gap-2 rounded-[18px] p-6 text-center shadow-[0_16px_40px_rgba(18,40,95,0.18)] md:p-10"
  >
    <p class="label">
      {{ $texts('edition.label', '10th anniversary gathering') }}
    </p>
    <h2 :id="headingId" class="text-3xl leading-tight md:text-4xl">
      {{ $texts('edition.title', 'Join us for our 6th edition') }}
    </h2>
    <p class="text-xl font-medium">
      {{ $texts('edition.dates', 'March 2–4, 2027') }}
    </p>
    <p class="label">
      {{ $texts('edition.venue', 'Davos Congress Centre, Switzerland') }}
    </p>
  </section>
</template>

<script lang="ts" setup>
const { $texts } = useEasyTexts()
const headingId = useId()
</script>
