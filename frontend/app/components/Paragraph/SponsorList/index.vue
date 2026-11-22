<template>
  <div class="my-7 md:mb-12 lg:mb-20">
    <Container>
      <div v-if="hasText(title)" class="mb-10 flex flex-col gap-2 lg:mb-14">
        <p v-if="year" class="label">
          {{ $texts('sponsors.yearLabel', 'Sponsors') }} {{ year }}
        </p>
        <h2 class="text-3xl md:text-5xl">{{ title }}</h2>
      </div>
      <p v-else-if="isEditing && !groups.length" class="text-gray-600">
        No published sponsors{{ year ? ` for ${year}` : '' }} yet.
      </p>
      <div class="flex flex-col gap-8 md:gap-10">
        <section
          v-for="group in groups"
          :key="group.key"
          class="rounded-3xl p-6 xs:p-8 lg:p-12"
          :class="
            group.isTop
              ? 'rounded-[32px] bg-gradient-to-b from-brand-tint to-brand-ice shadow-[0_30px_60px_-36px_rgba(18,40,95,0.55)]'
              : 'bg-brand-tint'
          "
        >
          <div
            class="mb-8 flex items-center justify-center gap-4 text-primary-400"
          >
            <svg
              :class="group.isTop ? 'h-[30px] w-[180px]' : 'h-5 w-[120px]'"
              class="hidden shrink-0 xs:block"
              viewBox="0 0 120 20"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M0 16 L24 6 L40 13 L62 2 L84 14 L100 8 L120 16" />
            </svg>
            <component
              :is="hasText(title) ? 'h3' : 'h2'"
              class="text-center font-bold text-primary-500"
              :class="
                group.isTop
                  ? 'text-[28px] uppercase tracking-wide md:text-[40px]'
                  : 'text-2xl md:text-3xl'
              "
            >
              {{ group.label }}
            </component>
            <svg
              :class="group.isTop ? 'h-[30px] w-[180px]' : 'h-5 w-[120px]'"
              class="hidden shrink-0 -scale-x-100 xs:block"
              viewBox="0 0 120 20"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M0 16 L24 6 L40 13 L62 2 L84 14 L100 8 L120 16" />
            </svg>
          </div>
          <ul class="flex flex-wrap items-center justify-center gap-5">
            <li
              v-for="sponsor in group.sponsors"
              :key="sponsor.uuid"
              class="min-w-0 max-w-full"
            >
              <SponsorTile
                :sponsor
                :box="group.tile.box"
                :tile-class="group.tile.tileClass"
                :described-by="newTabHintId"
                pill
              />
            </li>
            <!-- One invitation per tier while it still has an unsold spot. -->
            <li v-if="group.openSpot" class="min-w-0 max-w-full">
              <VuepalLink
                :to="SPONSORSHIP_PATH"
                class="flex max-w-full flex-col items-center justify-center rounded-full border-2 border-dashed border-primary-400 bg-white/60 px-4 text-center text-[15px] font-bold leading-tight text-primary-500 transition-colors hover:bg-white motion-reduce:transition-none"
                :class="group.tile.openClass"
              >
                {{ group.openSpot.text }}
                <span
                  v-if="group.openSpot.left !== null"
                  class="text-[13px] font-regular text-gray-700"
                >
                  {{ group.openSpot.left }}
                  {{ $texts('sponsors.spotsOf', 'of') }}
                  {{ group.openSpot.total }}
                  {{ $texts('sponsors.spotsLeft', 'left') }}
                </span>
              </VuepalLink>
            </li>
          </ul>
        </section>
      </div>
      <div v-if="isCurrentYear" class="mt-10 flex justify-center">
        <VuepalLink :to="SPONSORSHIP_PATH" class="button is-filled">
          {{ $texts('sponsors.cta', 'Become a sponsor') }}
        </VuepalLink>
      </div>
    </Container>
    <span :id="newTabHintId" hidden>
      {{ $texts('newTabHint', 'opens in a new tab') }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type {
  NodeSponsorFragment,
  ParagraphSponsorListFragment,
} from '#graphql-operations'
import {
  LOGO_BOXES,
  type LogoBox,
  SPONSOR_YEAR,
  TIER_SPOTS,
  SPONSORSHIP_PATH,
} from '~/helpers/sponsors'
import { hasText } from '~/helpers/text'

const props = defineProps<{
  title?: ParagraphSponsorListFragment['title']
  year?: ParagraphSponsorListFragment['year']
}>()

defineBlokkli({
  bundle: 'sponsor_list',
  editor: {
    editTitle: (el) => el.querySelector('h2')?.innerText,
  },
})

const isEditing = import.meta.blokkliEditing
const { $texts } = useEasyTexts()
const newTabHintId = useId()

// Display order and labels of the field_sponsor_tier allowed values.
const TIERS: Record<string, string> = {
  diamond: 'Diamond',
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  social: 'Social Event Sponsor',
  contribution: 'Contribution Sponsor',
  media: 'Media partner',
  hosting: 'Hosting partner',
  individual: 'Individual Sponsor',
}
const TIER_ORDER = Object.keys(TIERS)
const TOP_TIERS = new Set(['diamond', 'platinum'])

const TOP_TILE = {
  box: LOGO_BOXES.pillPlatinum,
  tileClass:
    'h-[150px] w-[320px] max-w-full shadow-[0_18px_36px_-18px_rgba(18,40,95,0.6)]',
  openClass: 'h-[96px] w-[220px]',
}
const LARGE_TILE = {
  box: LOGO_BOXES.pillLarge,
  tileClass: 'h-[116px] w-[250px] max-w-full',
  openClass: 'h-[76px] w-[180px]',
}
type Tile = { box: LogoBox; tileClass: string; openClass: string }
const TILE_BY_TIER: Record<string, Tile> = {
  diamond: TOP_TILE,
  platinum: TOP_TILE,
  gold: LARGE_TILE,
  silver: LARGE_TILE,
}
const DEFAULT_TILE = {
  box: LOGO_BOXES.pillSmall,
  tileClass: 'h-[88px] w-[190px] max-w-full',
  openClass: 'h-[60px] w-[150px]',
}

const OPEN_SPOT_TEXTS: Record<string, () => string> = {
  Platinum: () => $texts('sponsors.openSpot', 'Platinum spot available'),
  Gold: () => $texts('sponsors.openSpotGold', 'Gold spot available'),
  Silver: () => $texts('sponsors.openSpotSilver', 'Silver spot available'),
  Bronze: () => $texts('sponsors.openSpotBronze', 'Bronze spot available'),
}
const openSpotText = (label: string) => OPEN_SPOT_TEXTS[label]?.() ?? label

const isCurrentYear = computed(() => props.year === SPONSOR_YEAR)

const { sponsors: allSponsors } = await useAllSponsors()

const groups = computed(() => {
  const sponsors = allSponsors.value.filter(
    (item) => !props.year || item.year === props.year,
  )
  const byKey = new Map<string, NodeSponsorFragment[]>()
  for (const s of sponsors) {
    const key = `${s.year}:${s.tier}`
    byKey.set(key, [...(byKey.get(key) ?? []), s])
  }
  // In the current year every sold package gets a panel, also before its
  // first sponsor, so its open spot shows.
  if (isCurrentYear.value) {
    for (const tier of Object.keys(TIER_SPOTS)) {
      const key = `${SPONSOR_YEAR}:${tier}`
      if (!byKey.has(key)) {
        byKey.set(key, [])
      }
    }
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => {
      const [ya, ta] = a.split(':')
      const [yb, tb] = b.split(':')
      return (
        Number(yb) - Number(ya) ||
        TIER_ORDER.indexOf(ta!) - TIER_ORDER.indexOf(tb!)
      )
    })
    .map(([key, list]) => {
      const [y, tier] = key.split(':')
      const label = TIERS[tier!] ?? tier
      const total = TIER_SPOTS[tier!]
      const left = total === undefined ? 0 : total - list.length
      const openSpot =
        isCurrentYear.value && left > 0
          ? {
              text: openSpotText(label!),
              left: Number.isFinite(left) ? left : null,
              total,
            }
          : null
      return {
        key,
        // The year is only part of the heading when several years are shown.
        label: props.year ? label : `${label} ${y}`,
        sponsors: list,
        isTop: TOP_TIERS.has(tier!),
        openSpot,
        tile: TILE_BY_TIER[tier!] ?? DEFAULT_TILE,
      }
    })
})
</script>
