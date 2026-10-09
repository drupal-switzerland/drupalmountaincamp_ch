<template>
  <div class="container">
    <section
      :aria-labelledby="headingId"
      class="brand-hero on-dark relative flex flex-col gap-8 overflow-hidden rounded-3xl p-6 text-white xs:p-10 lg:p-14"
    >
      <BrandSparkles
        class="pointer-events-none absolute right-10 top-10 hidden w-28 text-white md:block lg:right-14 lg:top-12"
      />
      <div
        class="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between md:pr-40"
      >
        <div class="flex flex-col gap-2">
          <p class="label">{{ $texts('sponsors.label', 'Sponsors 2027') }}</p>
          <h2 :id="headingId" class="text-3xl md:text-5xl">
            <template v-if="titleParts">
              {{ titleParts.before
              }}<span class="text-primary-300">{{ titleParts.highlight }}</span
              >{{ titleParts.after }}
            </template>
            <template v-else>{{ title }}</template>
          </h2>
        </div>
        <VuepalLink
          :to="SPONSORSHIP_PATH"
          class="button shrink-0 border-white bg-white text-primary-500 hover:border-primary-100 hover:bg-primary-100 hover:text-primary-500"
        >
          {{ $texts('sponsors.cta', 'Become a sponsor') }}
        </VuepalLink>
      </div>
      <div v-if="platinum.length" class="flex flex-col gap-3">
        <h3 :id="platinumId" class="label">
          {{ $texts('sponsors.platinum', 'Platinum') }}
        </h3>
        <ul :aria-labelledby="platinumId" class="grid gap-5 md:grid-cols-3">
          <li v-for="sponsor in platinum" :key="sponsor.uuid">
            <SponsorTile
              :sponsor
              :box="LOGO_BOXES.card"
              tile-class="h-[140px] shadow-md"
              :described-by="newTabHintId"
            />
          </li>
          <!-- Unsold spots stay visible as an invitation until all are taken. -->
          <li v-for="spot in openSpots" :key="`open-${spot}`">
            <VuepalLink
              :to="SPONSORSHIP_PATH"
              class="flex h-[140px] items-center justify-center rounded-xl border-2 border-dashed border-primary-100 px-4 text-center font-bold text-white transition-colors hover:bg-white/10 motion-reduce:transition-none"
            >
              {{ $texts('sponsors.openSpot', 'Platinum spot available') }}
            </VuepalLink>
          </li>
        </ul>
      </div>
    </section>
    <span :id="newTabHintId" hidden>
      {{ $texts('newTabHint', 'opens in a new tab') }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import {
  LOGO_BOXES,
  PLATINUM_SPOTS,
  SPONSORSHIP_PATH,
  splitHighlight,
} from '~/helpers/sponsors'

defineBlokkliFragment({
  name: 'sponsors',
  label: 'Sponsors',
  description:
    'Platinum sponsors and the "Become a sponsor" button, updated automatically from Sponsor content.',
})

const { $texts } = useEasyTexts()
const headingId = useId()
const platinumId = useId()
const newTabHintId = useId()

const { currentByTier } = await useSponsors()
const platinum = computed(() => currentByTier.value.platinum ?? [])
const openSpots = computed(() =>
  Math.max(0, PLATINUM_SPOTS - platinum.value.length),
)

// Once every Platinum spot is sold the pitch turns into a thank-you.
const title = computed(() =>
  platinum.value.length >= PLATINUM_SPOTS
    ? $texts('sponsors.titleThanks', 'Thank you for taking us to the top')
    : $texts('sponsors.title', 'Put your brand on top of the world'),
)

const titleParts = computed(() =>
  splitHighlight(title.value, $texts('sponsors.titleHighlight', 'top')),
)
</script>
