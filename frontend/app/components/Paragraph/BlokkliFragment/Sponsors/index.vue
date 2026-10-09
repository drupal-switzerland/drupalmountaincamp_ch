<template>
  <div :class="{ 'sponsor-overlap': !isEditing }">
    <!-- After a coloured band the card is pulled up across its bottom edge
         (brand.css); after anything else it sits in the flow. -->
    <div class="container relative !my-0 pb-8 md:pb-12">
      <section
        :aria-labelledby="headingId"
        class="gradient-border relative flex flex-col gap-8 rounded-3xl p-6 shadow-[0_30px_60px_-30px_rgba(18,40,95,0.6)] xs:p-10 lg:px-12 lg:py-16"
      >
        <div
          class="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex flex-col gap-2">
            <p class="label">{{ $texts('sponsors.label', 'Sponsors 2027') }}</p>
            <h2 :id="headingId" class="text-3xl md:text-5xl">
              <template v-if="titleParts">
                {{ titleParts.before
                }}<span class="text-primary-400">{{
                  titleParts.highlight
                }}</span
                >{{ titleParts.after }}
              </template>
              <template v-else>{{ title }}</template>
            </h2>
          </div>
          <div
            class="flex w-full shrink-0 items-center gap-8 md:w-auto lg:gap-12"
          >
            <BrandSparkles class="hidden w-24 text-primary-300 md:block" />
            <VuepalLink
              :to="SPONSORSHIP_PATH"
              class="button is-filled w-full justify-center md:w-auto"
            >
              {{ $texts('sponsors.cta', 'Become a sponsor') }}
            </VuepalLink>
          </div>
        </div>
        <div v-if="platinum.length" class="flex flex-col gap-3">
          <h3 :id="platinumId" class="label">
            {{ $texts('sponsors.platinum', 'Platinum') }}
          </h3>
          <ul :aria-labelledby="platinumId" class="grid gap-5 md:grid-cols-3">
            <li v-for="sponsor in platinum" :key="sponsor.uuid" class="min-w-0">
              <SponsorTile
                :sponsor
                :box="LOGO_BOXES.card"
                tile-class="h-[140px]"
                :described-by="newTabHintId"
              />
            </li>
            <!-- Unsold spots stay visible as an invitation until all are taken. -->
            <li v-for="spot in openSpots" :key="`open-${spot}`">
              <VuepalLink
                :to="SPONSORSHIP_PATH"
                class="flex h-[140px] items-center justify-center rounded-xl border-2 border-dashed border-primary-400 px-4 text-center font-bold text-primary-400 transition-colors hover:bg-primary-50 motion-reduce:transition-none"
              >
                {{ $texts('sponsors.openSpot', 'Platinum spot available') }}
              </VuepalLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
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
const isEditing = import.meta.blokkliEditing
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
