<template>
  <!-- Fills the first screen, so the page below starts after a scroll. -->
  <section
    aria-labelledby="home-hero-title"
    class="home-hero-screen relative flex flex-col md:bg-primary-100"
  >
    <div
      class="on-dark home-hero relative isolate flex flex-1 flex-col overflow-hidden text-white"
    >
      <!-- This block and the one under the theme line grow by the same
           amount, so a taller screen adds as much navy above the badge as
           below the lead. -->
      <div
        class="container !my-0 flex grow flex-col items-center justify-end gap-4 pt-6 text-center xs:gap-5 xs:pt-12"
      >
        <p class="label">
          {{ $texts('hero.badge', '10 years of community') }}
        </p>
        <h1
          id="home-hero-title"
          v-blokkli-editable:title
          class="max-w-full text-[length:min(2.5rem,12.5vw)] leading-none [text-wrap:balance] xs:text-6xl md:text-7xl lg:text-8xl"
        >
          {{ titleParts.name }}
          <span v-if="titleParts.year" class="text-primary-300">
            {{ titleParts.year }}
          </span>
        </h1>
        <ThemeLine class="text-3xl xs:text-5xl md:text-6xl lg:text-[5rem]" />
      </div>
      <!-- Everything under the theme line: the box the blue rises in. -->
      <div class="relative flex grow flex-col">
        <span class="home-hero-rise" aria-hidden="true" />
        <span class="home-hero-horizon" aria-hidden="true" />
        <!-- Flex, so the lead's top margin stays inside and the blue starts at the title. -->
        <div
          class="home-hero-body container !my-0 flex grow flex-col pb-[var(--home-hero-pad)]"
        >
          <!-- Rich text so editors can add Button / Button (outline) links. -->
          <div
            v-if="lead"
            v-blokkli-editable:field_lead
            class="ck-content is-small home-hero-lead mx-auto mt-5 max-w-2xl text-center text-base xs:mt-6 md:text-2xl"
            v-html="lead"
          />
        </div>
        <BrandRidge
          mirrored
          class="relative z-[-1] mt-[calc(var(--home-hero-overlap)*-1)]"
        />
      </div>
    </div>

    <!-- From md it sits on the ridge's snow; the section's ice continues it below. -->
    <div
      class="relative z-[1] bg-primary-100 text-primary-500 md:mt-[-4.4vw] md:bg-transparent"
    >
      <!-- From md one grid: the title block, When and Where are subgrids over
           its two rows, so labels share a baseline and values share another.
           Where keeps 12rem when editors lengthen the title. A subgrid takes
           its own gap, so the dl repeats the column gaps. The narrower md gap
           keeps the title on one line at 1024px. -->
      <div
        class="container !my-0 grid gap-y-4 pb-8 pt-6 xs:pb-12 md:grid-cols-[minmax(0,max-content)_minmax(0,max-content)_minmax(12rem,1fr)_auto] md:grid-rows-[auto_auto] md:items-baseline md:gap-x-8 md:gap-y-1 md:pb-8 md:pt-0 lg:gap-x-12"
      >
        <div
          class="flex flex-col gap-1 md:row-span-2 md:grid md:grid-rows-subgrid md:items-baseline"
        >
          <p class="label">
            {{ $texts('edition.label', '10th anniversary gathering') }}
          </p>
          <h2 class="text-[1.375rem] leading-tight md:text-[1.625rem]">
            {{ $texts('edition.title', 'Join us for our 6th edition') }}
          </h2>
        </div>
        <dl
          class="grid grid-cols-2 gap-x-4 md:col-span-2 md:row-span-2 md:grid-cols-subgrid md:grid-rows-subgrid md:gap-x-8 lg:gap-x-12"
        >
          <div
            class="flex flex-col gap-1 md:row-span-2 md:grid md:grid-rows-subgrid md:items-baseline"
          >
            <dt class="label">{{ $texts('edition.whenLabel', 'When') }}</dt>
            <dd class="break-words font-medium md:text-lg">
              {{ $texts('edition.dates', 'March 2–4, 2027') }}
            </dd>
          </div>
          <div
            class="flex flex-col gap-1 md:row-span-2 md:grid md:grid-rows-subgrid md:items-baseline"
          >
            <dt class="label">{{ $texts('edition.whereLabel', 'Where') }}</dt>
            <dd class="break-words font-medium md:text-lg">
              {{ $texts('edition.venueShort', 'Davos Congress Centre') }}
            </dd>
          </div>
        </dl>
        <TicketsButton
          class="ticket-button mt-2 min-h-[52px] xs:mt-1 xs:min-h-14 md:row-span-2 md:mt-0 md:self-center"
        >
          {{ $texts('edition.tickets', 'Get tickets') }}
          <span aria-hidden="true">→</span>
        </TicketsButton>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const props = defineProps<{
  title?: string
  lead?: string
}>()

const { $texts } = useEasyTexts()

// "Mountain Camp 2027" renders the trailing year in the accent colour.
const titleParts = computed(() => {
  const title = props.title ?? ''
  const match = title.match(/^(.*\S)\s+(\d{4})$/)
  return match
    ? { name: match[1], year: match[2] }
    : { name: title, year: undefined }
})
</script>
