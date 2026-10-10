<template>
  <section aria-labelledby="home-hero-title" class="relative">
    <div class="on-dark home-hero relative isolate overflow-hidden text-white">
      <div
        class="container !my-0 flex flex-col gap-5 pt-6 xs:gap-6 xs:pt-12 md:pt-20"
      >
        <p
          class="label self-start rounded-full border-2 border-primary-100 px-4 py-1"
        >
          {{ $texts('hero.badge', '10 years of community') }}
        </p>
        <!-- The plus marks share the title's row so they line up with it at every width. -->
        <div class="flex items-center justify-between gap-4 md:gap-10">
          <h1
            id="home-hero-title"
            v-blokkli-editable:title
            class="shrink-[9999] text-[2.5rem] leading-none xs:text-6xl md:text-7xl lg:text-8xl"
          >
            {{ titleParts.name }}
            <span v-if="titleParts.year" class="text-primary-300">
              {{ titleParts.year }}
            </span>
          </h1>
          <div class="page-marks-box w-14 xs:w-24 md:w-36 lg:w-40">
            <BrandSparkles class="w-full text-white" />
          </div>
        </div>
      </div>
      <!-- Everything under the title row: the box the blue rises in. -->
      <div class="relative">
        <span class="home-hero-rise" aria-hidden="true" />
        <span class="home-hero-horizon" aria-hidden="true" />
        <!-- Flex, so the lead's top margin stays inside and the blue starts at the title. -->
        <div class="container !my-0 flex flex-col pb-[var(--home-hero-pad)]">
          <!-- Rich text so editors can add Button / Button (outline) links. -->
          <div
            v-if="lead"
            v-blokkli-editable:field_lead
            class="ck-content is-small home-hero-lead mt-5 max-w-2xl text-base xs:mt-6 md:text-2xl"
            v-html="lead"
          />
        </div>
        <BrandRidge
          mirrored
          class="relative z-[-1] mt-[calc(var(--home-hero-overlap)*-1)]"
        />
      </div>
    </div>

    <div class="bg-primary-100 text-primary-500">
      <div
        class="container !my-0 grid gap-y-4 pb-8 pt-6 xs:gap-y-2 xs:pb-12 md:grid-cols-[max-content_1fr_auto] md:items-center md:gap-y-0 md:pb-16 md:pt-8"
      >
        <div class="flex flex-col gap-[6px] md:pr-8">
          <p class="label">
            {{ $texts('edition.label', '10th anniversary gathering') }}
          </p>
          <h2 class="text-[1.375rem] leading-tight md:text-[1.625rem]">
            {{ $texts('edition.title', 'Join us for our 6th edition') }}
          </h2>
        </div>
        <dl
          class="grid grid-cols-2 border-t border-primary-500 md:flex md:border-t-0"
        >
          <div
            class="flex flex-col gap-1 py-2 pr-4 md:border-l md:border-primary-500 md:px-8 md:py-1"
          >
            <dt class="label">{{ $texts('edition.whenLabel', 'When') }}</dt>
            <dd class="font-medium md:text-lg">
              {{ $texts('edition.dates', 'March 2–4, 2027') }}
            </dd>
          </div>
          <div
            class="flex flex-col gap-1 border-l border-primary-500 py-2 pl-4 md:px-8 md:py-1"
          >
            <dt class="label">{{ $texts('edition.whereLabel', 'Where') }}</dt>
            <dd class="font-medium md:text-lg">
              {{
                $texts('edition.venue', 'Davos Congress Centre, Switzerland')
              }}
            </dd>
          </div>
        </dl>
        <VuepalLink
          v-if="ticketsLink"
          :to="ticketsLink.link.url?.path"
          class="ticket-button mt-2 min-h-[52px] xs:mt-1 xs:min-h-14"
        >
          {{ $texts('edition.tickets', 'Get tickets') }}
          <span aria-hidden="true">→</span>
        </VuepalLink>
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
const ticketsLink = await useTicketsLink()

// "Mountain Camp 2027" renders the trailing year in the accent colour.
const titleParts = computed(() => {
  const title = props.title ?? ''
  const match = title.match(/^(.*\S)\s+(\d{4})$/)
  return match
    ? { name: match[1], year: match[2] }
    : { name: title, year: undefined }
})
</script>
