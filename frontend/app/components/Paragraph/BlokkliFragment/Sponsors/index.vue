<template>
  <div class="container">
    <section
      :aria-labelledby="headingId"
      class="gradient-border is-light relative flex flex-col gap-7 rounded-[18px] p-6 shadow-lg md:p-11"
    >
      <BrandSparkles
        class="pointer-events-none absolute right-6 top-6 hidden w-28 text-primary-300 md:block lg:w-32"
      />
      <div class="flex flex-col gap-2 md:pr-36">
        <p class="label">{{ $texts('sponsors.label', 'Sponsors 2027') }}</p>
        <h2 :id="headingId" class="text-3xl md:text-5xl">
          <template v-if="titleParts">
            {{ titleParts.before
            }}<span class="text-primary-400">{{ titleParts.highlight }}</span
            >{{ titleParts.after }}
          </template>
          <template v-else>{{ title }}</template>
        </h2>
      </div>
      <div v-if="platinum.length" class="flex flex-col gap-3">
        <h3 :id="platinumId" class="label text-primary-500">
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
        </ul>
      </div>
      <VuepalLink :to="SPONSORSHIP_PATH" class="button is-filled self-start">
        {{ $texts('sponsors.cta', 'Become a sponsor') }}
      </VuepalLink>
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
