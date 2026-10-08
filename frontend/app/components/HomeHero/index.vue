<template>
  <div>
    <section
      aria-labelledby="home-hero-title"
      class="brand-hero on-dark relative overflow-hidden text-white"
    >
      <BrandSparkles
        class="pointer-events-none absolute right-4 top-5 w-24 text-white sm:right-8 md:top-10 md:w-36 lg:right-[7vw] lg:w-40"
      />
      <div class="container relative flex flex-col gap-6 pb-40 pt-12 md:pt-20">
        <p
          class="label self-start rounded-full border-2 border-primary-100 px-4 py-1"
        >
          {{ $texts('hero.badge', '10 years of community') }}
        </p>
        <h1
          id="home-hero-title"
          v-blokkli-editable:title
          class="max-w-4xl text-5xl leading-none md:text-7xl lg:text-8xl"
        >
          {{ titleParts.name }}
          <span v-if="titleParts.year" class="text-primary-300">
            {{ titleParts.year }}
          </span>
        </h1>
        <div
          v-if="lead"
          v-blokkli-editable:field_lead
          class="max-w-2xl text-xl md:text-2xl"
          v-html="lead"
        />
        <div class="flex flex-wrap gap-3">
          <VuepalLink
            :to="EVENT.ticketsPath"
            class="rounded-full bg-white px-6 py-3 font-bold text-primary-500 transition-colors hover:bg-primary-100"
          >
            {{ $texts('hero.tickets', 'Get your ticket') }}
          </VuepalLink>
          <VuepalLink
            :to="EVENT.callForSessionsPath"
            class="rounded-full border-2 border-white px-6 py-[10px] font-bold text-white transition-colors hover:bg-white hover:text-primary-500"
          >
            {{ $texts('hero.proposeTalk', 'Propose a talk') }}
          </VuepalLink>
        </div>
      </div>
      <div class="brand-strip" aria-hidden="true" />
    </section>
    <div class="relative -mt-24 px-outer">
      <EventEditionCard />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { EVENT } from '~/helpers/event'

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
